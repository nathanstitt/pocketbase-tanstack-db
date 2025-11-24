import PocketBase from 'pocketbase';
import { createCollection as createTanStackCollection, type Collection } from "@tanstack/db"
import { queryCollectionOptions } from "@tanstack/query-db-collection"
import { QueryClient } from '@tanstack/react-query'
import { SubscriptionManager } from './subscription-manager';
import type {
    SchemaDeclaration,
    SubscribableCollection,
    JoinHelper,
    ExpandableCollection,
    CreateCollectionOptions,
    RelationsConfig,
    WithExpandFromArray,
    ExpandableConfig,
    ExtractRecordType,
    ExtractRelations,
} from './types';

export type {
    SchemaDeclaration,
    SubscribableCollection,
    JoinHelper,
    CreateCollectionOptions,
    RelationsConfig,
} from './types';

/**
 * Configuration for collections passed to createCollections().
 * Maps collection keys to their configuration options.
 */
export type CollectionsConfig<Schema extends SchemaDeclaration> = {
    [K in keyof Schema]?: CreateCollectionOptions<Schema, K>;
};

/**
 * Inferred type for a single collection from config.
 * @internal
 */
type InferCollectionType<
    Schema extends SchemaDeclaration,
    C extends keyof Schema,
    Opts extends CreateCollectionOptions<Schema, C>
> = Collection<
    ExtractRecordType<Schema, C>,
    string | number,
    any,
    any,
    Opts extends { omitOnInsert: infer O extends readonly (Exclude<keyof ExtractRecordType<Schema, C>, 'id'>)[] }
        ? import('./types').ComputeInsertType<ExtractRecordType<Schema, C>, O>
        : ExtractRecordType<Schema, C>
> &
   SubscribableCollection<ExtractRecordType<Schema, C>> &
   JoinHelper<Schema, C, ExtractRecordType<Schema, C>> &
   ExpandableCollection<Schema, C, ExtractRecordType<Schema, C>>;

/**
 * Builds a map of collection keys to their inferred Collection types.
 * @internal
 */
export type InferCollectionsMap<
    Schema extends SchemaDeclaration,
    Config extends CollectionsConfig<Schema>
> = {
    [K in keyof Config]: K extends keyof Schema
        ? Config[K] extends CreateCollectionOptions<Schema, K>
            ? InferCollectionType<Schema, K, Config[K]>
            : never
        : never;
};

/**
 * Internal helper to create a single collection with all enhancements.
 * Extracted from the old CollectionFactory.create() method.
 * @internal
 */
function createSingleCollection<
    Schema extends SchemaDeclaration,
    C extends keyof Schema & string,
    Opts extends CreateCollectionOptions<Schema, C> = CreateCollectionOptions<Schema, C>
>(
    pb: PocketBase,
    queryClient: QueryClient,
    subscriptionManager: SubscriptionManager,
    collectionName: C,
    options?: Opts
): InferCollectionType<Schema, C, Opts> {
    type RecordType = ExtractRecordType<Schema, C>;

    const baseCollection = createTanStackCollection(
        queryCollectionOptions<RecordType>({
            queryKey: [collectionName],
            queryFn: async () => {
                const result = await pb
                    .collection(collectionName)
                    .getFullList();

                return result as unknown as RecordType[];
            },
            queryClient: queryClient,
            getKey: (item: RecordType) => (item as { id: string }).id,
            startSync: options?.startSync ?? false,
            onInsert: options?.onInsert === false ? undefined : options?.onInsert ?? (async ({ transaction }) => {
                await Promise.all(
                    transaction.mutations.map(async (mutation) => {
                        const { id, created, updated, collectionId, collectionName: _, ...data } = mutation.modified as Record<string, unknown>;
                        await pb.collection(collectionName).create(data);
                    })
                );
                await queryClient.invalidateQueries({ queryKey: [collectionName] });
            }),
            onUpdate: options?.onUpdate === false ? undefined : options?.onUpdate ?? (async ({ transaction }) => {
                await Promise.all(
                    transaction.mutations.map(async (mutation) => {
                        const recordWithId = mutation.original as { id: string };
                        await pb.collection(collectionName).update(recordWithId.id, mutation.changes);
                    })
                );
                await queryClient.invalidateQueries({ queryKey: [collectionName] });
            }),
            onDelete: options?.onDelete === false ? undefined : options?.onDelete ?? (async ({ transaction }) => {
                await Promise.all(
                    transaction.mutations.map(async (mutation) => {
                        const recordWithId = mutation.original as { id: string };
                        await pb.collection(collectionName).delete(recordWithId.id);
                    })
                );
                await queryClient.invalidateQueries({ queryKey: [collectionName] });
            }),
        })
    );

    const subscribableCollection = Object.assign(baseCollection, {
        subscribe: async (recordId?: string) => {
            await subscriptionManager.subscribe(collectionName, baseCollection, recordId);
        },
        unsubscribe: (recordId?: string) => {
            subscriptionManager.unsubscribe(collectionName, recordId);
        },
        unsubscribeAll: () => {
            subscriptionManager.unsubscribeAll(collectionName);
        },
        isSubscribed: (recordId?: string) => {
            return subscriptionManager.isSubscribed(collectionName, recordId);
        },
        waitForSubscription: async (recordId?: string, timeoutMs?: number) => {
            await subscriptionManager.waitForSubscription(collectionName, recordId, timeoutMs);
        },
        relations: options?.relations || {} as RelationsConfig<Schema, C>,
        expand: <Fields extends readonly (keyof ExtractRelations<Schema, C> & string)[]>(
            fields: Fields
        ): Collection<WithExpandFromArray<RecordType, Schema, C, Fields>> => {
            if (!options?.expandable) {
                throw new Error(
                    `Collection '${collectionName}' does not have expandable config. ` +
                    `Add 'expandable' option when creating the collection.`
                );
            }

            const expandableConfig = options.expandable;
            const sortedFields = [...fields].sort();
            const expandString = sortedFields.join(',');

            for (const field of fields) {
                if (!(field in expandableConfig)) {
                    throw new Error(
                        `Field '${String(field)}' is not in expandable config for collection '${collectionName}'. ` +
                        `Available fields: ${Object.keys(expandableConfig).join(', ')}`
                    );
                }
            }

            type ExpandedRecordType = WithExpandFromArray<RecordType, Schema, C, Fields>;

            const expandedCollection = createTanStackCollection(
                queryCollectionOptions<ExpandedRecordType>({
                    queryKey: [collectionName, { expand: expandString }],
                    queryFn: async () => {
                        const records = await pb
                            .collection(collectionName)
                            .getFullList({ expand: expandString });

                        for (const record of records) {
                            const typedRecord = record as unknown as ExpandedRecordType;
                            if (typedRecord.expand) {
                                for (const field of fields) {
                                    const expandedData = typedRecord.expand[field as keyof typeof typedRecord.expand];
                                    const targetCollection = expandableConfig[field];

                                    if (!expandedData || !targetCollection) continue;

                                    try {
                                        if (Array.isArray(expandedData)) {
                                            for (const item of expandedData) {
                                                targetCollection.utils.writeInsert(item);
                                            }
                                        } else {
                                            targetCollection.utils.writeInsert(expandedData);
                                        }
                                    } catch (error) {
                                        if (error instanceof Error && !error.message.includes('Sync not initialized')) {
                                            throw error;
                                        }
                                    }
                                }
                            }
                        }

                        return records as unknown as ExpandedRecordType[];
                    },
                    queryClient: queryClient,
                    getKey: (item: ExpandedRecordType) => (item as { id: string }).id,
                    startSync: options?.startSync ?? false,
                })
            );

            return expandedCollection as any;
        }
    });

    subscribableCollection.on('subscribers:change', (event) => {
        const newCount = event.subscriberCount;
        const previousCount = event.previousSubscriberCount;

        if (newCount > previousCount) {
            subscriptionManager.addSubscriber(collectionName, baseCollection).catch(() => {
            });
        } else if (newCount < previousCount) {
            subscriptionManager.removeSubscriber(collectionName);
        }
    });

    return subscribableCollection as any;
}

/**
 * Two-level WeakMap to cache subscription managers per (PocketBase, QueryClient) pair.
 * This ensures collections created with the same PocketBase AND QueryClient share one manager,
 * while allowing different QueryClients (e.g., in tests) to have isolated managers.
 * @internal
 */
const subscriptionManagerCache = new WeakMap<PocketBase, WeakMap<QueryClient, SubscriptionManager>>();

/**
 * Gets or creates a subscription manager for a (PocketBase, QueryClient) pair.
 * @internal
 */
function getSubscriptionManager(pb: PocketBase, queryClient: QueryClient): SubscriptionManager {
    let queryClientMap = subscriptionManagerCache.get(pb);
    if (!queryClientMap) {
        queryClientMap = new WeakMap<QueryClient, SubscriptionManager>();
        subscriptionManagerCache.set(pb, queryClientMap);
    }

    let manager = queryClientMap.get(queryClient);
    if (!manager) {
        manager = new SubscriptionManager(pb);
        queryClientMap.set(queryClient, manager);
    }
    return manager;
}

/**
 * Creates a single type-safe TanStack DB collection backed by PocketBase.
 * Use this when you need fine-grained control or need to create collections with dependencies.
 *
 * @param pb - PocketBase client instance
 * @param queryClient - TanStack Query client
 * @param collectionName - The name of the PocketBase collection
 * @param options - Optional configuration for the collection
 * @returns Fully-typed Collection instance with subscription capabilities
 *
 * @example
 * Basic usage:
 * ```ts
 * const booksCollection = createCollection<Schema>(pb, queryClient)('books', {});
 *
 * // Use directly
 * const books = await booksCollection.getFullList();
 * ```
 *
 * @example
 * With expandable relations (requires creating dependencies first):
 * ```ts
 * const authorsCollection = createCollection<Schema>(pb, queryClient)('authors', {});
 * const booksCollection = createCollection<Schema>(pb, queryClient)('books', {
 *     expandable: {
 *         author: authorsCollection
 *     }
 * });
 *
 * const booksWithAuthor = booksCollection.expand(['author'] as const);
 * ```
 */
export function createCollection<Schema extends SchemaDeclaration>(
    pb: PocketBase,
    queryClient: QueryClient
) {
    const subscriptionManager = getSubscriptionManager(pb, queryClient);

    return <
        C extends keyof Schema & string,
        Opts extends CreateCollectionOptions<Schema, C> = CreateCollectionOptions<Schema, C>
    >(
        collectionName: C,
        options?: Opts
    ): InferCollectionType<Schema, C, Opts> => {
        return createSingleCollection(
            pb,
            queryClient,
            subscriptionManager,
            collectionName,
            options
        );
    };
}

/**
 * Creates a map of type-safe TanStack DB collections backed by PocketBase.
 * This is the universal collection creation function that works everywhere (React, Node.js, etc.).
 *
 * @param pb - PocketBase client instance
 * @param queryClient - TanStack Query client
 * @param config - Configuration object mapping collection names to their options
 * @returns Map of collection names to their fully-typed Collection instances
 *
 * @example
 * Basic usage:
 * ```ts
 * const collections = createCollections<Schema>(pb, queryClient)({
 *     books: {},
 *     authors: {}
 * });
 *
 * // Use directly (non-React)
 * const books = await collections.books.getFullList();
 * ```
 *
 * @example
 * With omitOnInsert:
 * ```ts
 * const collections = createCollections<Schema>(pb, queryClient)({
 *     books: {
 *         omitOnInsert: ['created', 'updated'] as const
 *     }
 * });
 *
 * // Insert without server-generated fields
 * collections.books.insert({
 *     id: newRecordId(),
 *     title: 'New Book',
 *     // created and updated are optional
 * });
 * ```
 *
 * @example
 * React integration (use with createReactProvider):
 * ```tsx
 * const collections = createCollections<Schema>(pb, queryClient)({
 *     books: {},
 *     authors: {}
 * });
 *
 * const { Provider, useStore } = createReactProvider(collections);
 * ```
 *
 * @example
 * With expandable relations (create dependencies separately):
 * ```ts
 * // For expandable, use createCollection (singular) instead:
 * const authorsCollection = createCollection<Schema>(pb, queryClient)('authors', {});
 * const booksCollection = createCollection<Schema>(pb, queryClient)('books', {
 *     expandable: { author: authorsCollection }
 * });
 * ```
 */
export function createCollections<Schema extends SchemaDeclaration>(
    pb: PocketBase,
    queryClient: QueryClient
) {
    return <Config extends CollectionsConfig<Schema>>(
        config: Config
    ): InferCollectionsMap<Schema, Config> => {
        const subscriptionManager = getSubscriptionManager(pb, queryClient);

        const collections = Object.fromEntries(
            Object.entries(config).map(([key, opts]) => {
                const collectionName = key as keyof Schema & string;
                const collection = createSingleCollection(
                    pb,
                    queryClient,
                    subscriptionManager,
                    collectionName,
                    opts as any
                );
                return [key, collection];
            })
        ) as unknown as InferCollectionsMap<Schema, Config>;

        return collections;
    };
}
