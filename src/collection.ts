import PocketBase from 'pocketbase';
import { createCollection, type Collection } from "@tanstack/db"
import { queryCollectionOptions } from "@tanstack/query-db-collection"
import { QueryClient } from '@tanstack/react-query'
import { SubscriptionManager } from './subscription-manager';
import type {
    SchemaDeclaration,
    SubscribableCollection,
    JoinHelper,
    CreateCollectionOptions,
    RelationsConfig,
    WithExpand,
} from './types';

// Re-export commonly used types for convenience
export type {
    SchemaDeclaration,
    SubscribableCollection,
    JoinHelper,
    CreateCollectionOptions,
    RelationsConfig,
} from './types';

// Re-export React provider and hooks
export {
    CollectionsProvider,
    useStore,
    useStores,
    type CollectionsMap,
    type CollectionsProviderProps,
} from './provider';

/**
 * Helper function to build PocketBase query options.
 * Centralizes query option construction for consistency and future extensibility.
 */
function buildPocketBaseQueryOptions<E extends string | undefined>(
    expand?: E
): { expand?: string } {
    const options: { expand?: string } = {};
    if (expand) {
        options.expand = expand;
    }
    return options;
}

/**
 * Factory for creating type-safe TanStack DB collections backed by PocketBase.
 * Integrates real-time subscriptions with automatic synchronization.
 */
export class CollectionFactory<Schema extends SchemaDeclaration, TMaxDepth extends 0 | 1 | 2 | 3 | 4 | 5 | 6 = 2> {
    private subscriptionManager: SubscriptionManager;

    constructor(public pocketbase: PocketBase, public queryClient: QueryClient) {
        this.subscriptionManager = new SubscriptionManager(pocketbase);
    }

    /**
     * Create a TanStack DB collection from a PocketBase collection.
     *
     * @param collection - The name of the collection
     * @param options - Optional configuration including relations and expand
     *
     * @example
     * Basic usage with automatic real-time subscription:
     * ```ts
     * const jobsCollection = factory.create('jobs');
     * // Automatically subscribed to all changes
     * ```
     *
     * @example
     * Manual subscription control:
     * ```ts
     * const jobsCollection = factory.create('jobs');
     *
     * // Subscribe to specific record
     * jobsCollection.subscribe('record_id_123');
     *
     * // Unsubscribe from specific record
     * jobsCollection.unsubscribe('record_id_123');
     *
     * // Unsubscribe from all
     * jobsCollection.unsubscribeAll();
     *
     * // Check subscription status
     * const isSubbed = jobsCollection.isSubscribed(); // collection-wide
     * const isSubbed2 = jobsCollection.isSubscribed('record_id_123'); // specific record
     * ```
     *
     * @example
     * Opt-out of automatic subscriptions:
     * ```ts
     * // Disable auto-subscription for better control
     * const jobsCollection = factory.create('jobs', {
     *     enableSubscriptions: false
     * });
     *
     * // Later, manually subscribe when needed
     * jobsCollection.subscribe(); // Subscribe to all changes
     *
     * // Or subscribe to specific record
     * jobsCollection.subscribe('record_id_123');
     * ```
     *
     * @example
     * With query operators (filters, sorting):
     * ```ts
     * const jobsCollection = factory.create('jobs');
     *
     * // In your component:
     * const { data } = useLiveQuery((q) =>
     *     q.from({ jobs: jobsCollection })
     *      .where(({ jobs }) => and(
     *          eq(jobs.status, 'ACTIVE'),
     *          gt(jobs.created, new Date('2025-01-01'))
     *      ))
     *      .orderBy(({ jobs }) => jobs.created, 'desc')
     * );
     * ```
     *
     * @example
     * With relation expansion:
     * ```ts
     * const jobsCollection = factory.create('jobs', {
     *     expand: 'customer,location'
     * });
     *
     * // Expanded relations available in record.expand
     * ```
     *
     * @example
     * With relations (for manual joins):
     * ```ts
     * const customersCollection = factory.create('customers');
     * const jobsCollection = factory.create('jobs', {
     *     relations: { customer: customersCollection }
     * });
     *
     * // In your component, manually build joins:
     * const { data } = useLiveQuery((q) =>
     *     q.from({ job: jobsCollection })
     *      .join(
     *          { customer: customersCollection },
     *          ({ job, customer }) => eq(job.customer, customer.id),
     *          "left"
     *      )
     *      .select(({ job, customer }) => ({
     *          ...job,
     *          expand: {
     *              customer: customer ? { ...customer } : undefined
     *          }
     *      }))
     * );
     * ```
     */
    create<
        C extends keyof Schema & string,
        E extends string | undefined = undefined
    >(
        collection: C,
        options?: CreateCollectionOptions<Schema, C, E>
    ): Collection<WithExpand<Schema, C, E>> & SubscribableCollection<WithExpand<Schema, C, E>> & JoinHelper<Schema, C, WithExpand<Schema, C, E>> {
        type RecordType = WithExpand<Schema, C, E>;

        const baseCollection = createCollection(
            queryCollectionOptions<RecordType>({
                queryKey: [collection],
                // No syncMode - use default behavior which auto-loads data
                queryFn: async () => {
                    // Build query options using helper
                    const queryOptions = buildPocketBaseQueryOptions(options?.expand);

                    // Execute query against PocketBase - fetch all data
                    const result = await this.pocketbase
                        .collection(collection)
                        .getFullList(queryOptions);

                    // Return the result with proper typing
                    return result as unknown as RecordType[];
                },
                queryClient: this.queryClient,
                getKey: (item: RecordType) => (item as { id: string }).id,
            })
        );

        // Enhance collection with subscription management methods and join helpers
        const subscribableCollection = Object.assign(baseCollection, {
            subscribe: async (recordId?: string) => {
                await this.subscriptionManager.subscribe(collection, baseCollection, recordId);
            },
            unsubscribe: (recordId?: string) => {
                this.subscriptionManager.unsubscribe(collection, recordId);
            },
            unsubscribeAll: () => {
                this.subscriptionManager.unsubscribeAll(collection);
            },
            isSubscribed: (recordId?: string) => {
                return this.subscriptionManager.isSubscribed(collection, recordId);
            },
            waitForSubscription: async (recordId?: string, timeoutMs?: number) => {
                await this.subscriptionManager.waitForSubscription(collection, recordId, timeoutMs);
            },
            relations: options?.relations || {} as RelationsConfig<Schema, C>
        });

        // Automatically subscribe to collection-wide updates on creation (if enabled)
        // Note: This runs asynchronously in the background - the collection is usable immediately
        const enableSubscriptions = options?.enableSubscriptions !== false; // Default to true
        if (enableSubscriptions) {
            // Fire and forget - subscription establishes in background
            this.subscriptionManager.subscribe(collection, baseCollection).catch(() => {
                // Silently handle subscription errors - reconnection will be attempted
            });
        }

        return subscribableCollection as Collection<RecordType> & SubscribableCollection<RecordType> & JoinHelper<Schema, C, RecordType>;
    }
}
