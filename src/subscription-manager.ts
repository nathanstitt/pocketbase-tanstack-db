import PocketBase from 'pocketbase';
import type { UnsubscribeFunc } from 'pocketbase';
import type { Collection } from "@tanstack/db"
import type { RealtimeEvent, SubscriptionState } from './types';
import { logger } from './logger';

export const SUBSCRIPTION_CONFIG = {
    MAX_RECONNECT_ATTEMPTS: 5,
    BASE_RECONNECT_DELAY_MS: 1000,
    DEFAULT_WAIT_TIMEOUT_MS: 5000,
    CLEANUP_DELAY_MS: 5000,
} as const;

function hasId(record: unknown): record is { id: string } {
    return typeof record === 'object'
        && record !== null
        && 'id' in record
        && typeof (record as { id: unknown }).id === 'string';
}

function createPendingSubscriptionState(recordId?: string): SubscriptionState {
    return {
        unsubscribe: async () => {},
        recordId,
        reconnectAttempts: 0,
        isReconnecting: false,
    };
}

function getSubscriptionKey(recordId?: string): string {
    return recordId || '*';
}


/**
 * Manages real-time subscriptions to PocketBase collections.
 * Handles subscription lifecycle, reconnection with exponential backoff,
 * and automatic synchronization with TanStack DB collections.
 *
 * Subscriptions are automatically managed based on TanStack DB's subscriber count:
 * - Start subscribing when first query becomes active
 * - Stop subscribing when last query becomes inactive (with cleanup delay)
 */
export class SubscriptionManager {
    private subscriptions: Map<string, Map<string, SubscriptionState>> = new Map();
    private subscriptionPromises: Map<string, Map<string, Promise<void>>> = new Map();
    private cleanupTimers: Map<string, NodeJS.Timeout> = new Map();
    private subscriberCounts: Map<string, number> = new Map();

    constructor(private pocketbase: PocketBase) {}

    // ============================================================================
    // Internal Helpers
    // ============================================================================

    private async setupSubscription<T extends object>(
        collectionName: string,
        collection: Collection<T>,
        recordId?: string
    ): Promise<UnsubscribeFunc> {
        const subscriptionKey = getSubscriptionKey(recordId);

        const eventHandler = (event: RealtimeEvent<T>) => {
            collection.utils.writeBatch(() => {
                switch (event.action) {
                    case 'create':
                        collection.utils.writeInsert(event.record);
                        break;
                    case 'update':
                        collection.utils.writeUpdate(event.record);
                        break;
                    case 'delete':
                        if (!hasId(event.record)) {
                            logger.error('Delete event record missing id field', {
                                collectionName,
                                record: event.record
                            });
                            return;
                        }
                        collection.utils.writeDelete(event.record.id);
                        break;
                }
            });
        };

        const unsubscribe = await this.pocketbase
            .collection(collectionName)
            .subscribe(subscriptionKey, eventHandler);

        logger.debug('Subscription established', { collectionName, subscriptionKey });

        return unsubscribe;
    }

    private async handleReconnection<T extends object>(
        collectionName: string,
        collection: Collection<T>,
        recordId?: string
    ): Promise<void> {
        const collectionSubs = this.subscriptions.get(collectionName);
        if (!collectionSubs) return;

        const subscriptionKey = getSubscriptionKey(recordId);
        const state = collectionSubs.get(subscriptionKey);
        if (!state || state.isReconnecting) return;

        state.isReconnecting = true;
        logger.warn('Starting reconnection attempts', { collectionName, subscriptionKey });

        while (state.reconnectAttempts < SUBSCRIPTION_CONFIG.MAX_RECONNECT_ATTEMPTS) {
            const delay = SUBSCRIPTION_CONFIG.BASE_RECONNECT_DELAY_MS * Math.pow(2, state.reconnectAttempts);
            logger.debug(`Reconnection attempt ${state.reconnectAttempts + 1}, waiting ${delay}ms`, {
                collectionName,
                subscriptionKey
            });
            await new Promise(resolve => setTimeout(resolve, delay));

            try {
                const newUnsubscribe = await this.setupSubscription(
                    collectionName,
                    collection,
                    recordId
                );

                state.unsubscribe = newUnsubscribe;
                state.reconnectAttempts = 0;
                state.isReconnecting = false;
                logger.debug('Reconnection successful', { collectionName, subscriptionKey });
                return;
            } catch (error) {
                state.reconnectAttempts++;
                logger.warn(`Reconnection attempt ${state.reconnectAttempts} failed`, {
                    collectionName,
                    subscriptionKey,
                    error
                });
            }
        }

        logger.error('Max reconnection attempts reached', {
            collectionName,
            subscriptionKey,
            attempts: state.reconnectAttempts
        });
        state.isReconnecting = false;
        collectionSubs.delete(subscriptionKey);
    }

    // ============================================================================
    // Core Subscription Methods
    // ============================================================================

    /**
     * Subscribe to real-time updates for a collection.
     * Returns a promise that resolves when the subscription is fully established.
     *
     * @param collectionName - The PocketBase collection name
     * @param collection - The TanStack DB collection to sync with
     * @param recordId - Optional: Subscribe to specific record, or omit for collection-wide updates
     */
    async subscribe<T extends object>(
        collectionName: string,
        collection: Collection<T>,
        recordId?: string
    ): Promise<void> {
        if (!this.subscriptions.has(collectionName)) {
            this.subscriptions.set(collectionName, new Map());
        }
        if (!this.subscriptionPromises.has(collectionName)) {
            this.subscriptionPromises.set(collectionName, new Map());
        }

        const collectionSubs = this.subscriptions.get(collectionName)!;
        const collectionPromises = this.subscriptionPromises.get(collectionName)!;
        const subscriptionKey = getSubscriptionKey(recordId);

        if (collectionSubs.has(subscriptionKey)) {
            logger.debug('Already subscribed, skipping', { collectionName, subscriptionKey });
            return;
        }

        const existingPromise = collectionPromises.get(subscriptionKey);
        if (existingPromise) {
            logger.debug('Pending subscription found, waiting', { collectionName, subscriptionKey });
            return existingPromise;
        }

        // Placeholder ensures isSubscribed() returns true immediately
        collectionSubs.set(subscriptionKey, createPendingSubscriptionState(recordId));

        const subscriptionPromise = (async () => {
            try {
                const unsubscribe = await this.setupSubscription(collectionName, collection, recordId);

                const state = collectionSubs.get(subscriptionKey);
                if (state) {
                    state.unsubscribe = unsubscribe;
                }
            } catch (error) {
                collectionSubs.delete(subscriptionKey);
                collectionPromises.delete(subscriptionKey);
                logger.error('Subscription failed', { collectionName, subscriptionKey, error });
                await this.handleReconnection(collectionName, collection, recordId);
                throw error;
            }
            // Keep promise for waitForSubscription to check completion
        })();

        collectionPromises.set(subscriptionKey, subscriptionPromise);

        try {
            await subscriptionPromise;
        } catch (_error) {
            // Error logged and reconnection initiated above
        }
    }

    /**
     * Unsubscribe from real-time updates.
     *
     * @param collectionName - The PocketBase collection name
     * @param recordId - Optional: Unsubscribe from specific record, or omit for collection-wide
     */
    unsubscribe(collectionName: string, recordId?: string): void {
        const collectionSubs = this.subscriptions.get(collectionName);
        if (!collectionSubs) return;

        const subscriptionKey = getSubscriptionKey(recordId);
        const state = collectionSubs.get(subscriptionKey);

        if (state) {
            const unsubPromise = state.unsubscribe();
            if (unsubPromise && typeof unsubPromise.catch === 'function') {
                unsubPromise.catch((error) => {
                    logger.debug('Unsubscribe failed (expected if connection closed)', {
                        collectionName,
                        subscriptionKey,
                        error
                    });
                });
            }
            collectionSubs.delete(subscriptionKey);
            logger.debug('Unsubscribed', { collectionName, subscriptionKey });
        }

        const collectionPromises = this.subscriptionPromises.get(collectionName);
        if (collectionPromises) {
            collectionPromises.delete(subscriptionKey);
            if (collectionPromises.size === 0) {
                this.subscriptionPromises.delete(collectionName);
            }
        }

        if (collectionSubs.size === 0) {
            this.subscriptions.delete(collectionName);
        }
    }

    /**
     * Unsubscribe from all subscriptions for a collection.
     *
     * @param collectionName - The PocketBase collection name
     */
    unsubscribeAll(collectionName: string): void {
        const collectionSubs = this.subscriptions.get(collectionName);
        if (!collectionSubs) return;

        logger.debug('Unsubscribing from all subscriptions', { collectionName, count: collectionSubs.size });

        for (const state of collectionSubs.values()) {
            const unsubPromise = state.unsubscribe();
            if (unsubPromise && typeof unsubPromise.catch === 'function') {
                unsubPromise.catch((error) => {
                    logger.debug('Unsubscribe failed (expected if connection closed)', {
                        collectionName,
                        error
                    });
                });
            }
        }

        this.subscriptions.delete(collectionName);
        this.subscriptionPromises.delete(collectionName);
    }

    // ============================================================================
    // State Queries
    // ============================================================================

    /**
     * Check if subscribed to a collection.
     *
     * @param collectionName - The PocketBase collection name
     * @param recordId - Optional: Check specific record subscription, or omit for collection-wide
     */
    isSubscribed(collectionName: string, recordId?: string): boolean {
        const collectionSubs = this.subscriptions.get(collectionName);
        if (!collectionSubs) return false;

        const subscriptionKey = getSubscriptionKey(recordId);
        return collectionSubs.has(subscriptionKey);
    }

    /**
     * Wait for a subscription to be fully established (useful for testing).
     *
     * @param collectionName - The collection name
     * @param recordId - Optional specific record ID
     * @param timeoutMs - Timeout in milliseconds
     */
    async waitForSubscription(
        collectionName: string,
        recordId?: string,
        timeoutMs: number = SUBSCRIPTION_CONFIG.DEFAULT_WAIT_TIMEOUT_MS
    ): Promise<void> {
        const subscriptionKey = getSubscriptionKey(recordId);
        const collectionSubs = this.subscriptions.get(collectionName);

        if (collectionSubs?.has(subscriptionKey)) {
            const collectionPromises = this.subscriptionPromises.get(collectionName);
            if (!collectionPromises?.has(subscriptionKey)) {
                return;
            }
        }

        const collectionPromises = this.subscriptionPromises.get(collectionName);
        const promise = collectionPromises?.get(subscriptionKey);

        if (!promise) {
            const isSubscribed = collectionSubs?.has(subscriptionKey);
            if (!isSubscribed) {
                throw new Error(`No subscription found for ${collectionName}:${subscriptionKey}`);
            }
            return;
        }

        const timeoutPromise = new Promise<void>((_, reject) => {
            setTimeout(() => reject(new Error(`Subscription timeout after ${timeoutMs}ms`)), timeoutMs);
        });

        await Promise.race([promise, timeoutPromise]);
    }

    // ============================================================================
    // Lifecycle Management
    // ============================================================================

    /**
     * Track subscriber addition for a collection.
     * Automatically subscribes when first subscriber is added.
     *
     * @param collectionName - The PocketBase collection name
     * @param collection - The TanStack DB collection to sync with
     */
    async addSubscriber<T extends object>(
        collectionName: string,
        collection: Collection<T>
    ): Promise<void> {
        const currentCount = this.subscriberCounts.get(collectionName) || 0;
        const newCount = currentCount + 1;
        this.subscriberCounts.set(collectionName, newCount);

        logger.debug('Subscriber added', { collectionName, count: newCount });

        const cleanupTimer = this.cleanupTimers.get(collectionName);
        if (cleanupTimer) {
            clearTimeout(cleanupTimer);
            this.cleanupTimers.delete(collectionName);
            logger.debug('Cleanup timer cancelled', { collectionName });
        }

        if (newCount === 1 && !this.isSubscribed(collectionName)) {
            logger.debug('First subscriber - starting subscription', { collectionName });
            await this.subscribe(collectionName, collection);
        }
    }

    /**
     * Track subscriber removal for a collection.
     * Automatically unsubscribes (with delay) when last subscriber is removed.
     *
     * @param collectionName - The PocketBase collection name
     */
    removeSubscriber(collectionName: string): void {
        const currentCount = this.subscriberCounts.get(collectionName) || 0;
        const newCount = Math.max(0, currentCount - 1);
        this.subscriberCounts.set(collectionName, newCount);

        logger.debug('Subscriber removed', { collectionName, count: newCount });

        if (newCount === 0) {
            const existingTimer = this.cleanupTimers.get(collectionName);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }

            const cleanupTimer = setTimeout(() => {
                const finalCount = this.subscriberCounts.get(collectionName) || 0;
                if (finalCount === 0) {
                    logger.debug('Cleanup timer fired - unsubscribing', { collectionName });
                    this.unsubscribeAll(collectionName);
                    this.subscriberCounts.delete(collectionName);
                }
                this.cleanupTimers.delete(collectionName);
            }, SUBSCRIPTION_CONFIG.CLEANUP_DELAY_MS);

            this.cleanupTimers.set(collectionName, cleanupTimer);
            logger.debug('Cleanup timer scheduled', {
                collectionName,
                delayMs: SUBSCRIPTION_CONFIG.CLEANUP_DELAY_MS
            });
        }
    }

    /**
     * Get the current subscriber count for a collection.
     * Useful for debugging and testing.
     *
     * @param collectionName - The PocketBase collection name
     * @returns Current subscriber count
     */
    getSubscriberCount(collectionName: string): number {
        return this.subscriberCounts.get(collectionName) || 0;
    }
}
