import PocketBase from 'pocketbase';
import { createCollection as createTanStackCollection, type Collection, type LoadSubsetOptions } from "@tanstack/react-db"
import { queryCollectionOptions } from "@tanstack/query-db-collection"
import { QueryClient } from '@tanstack/react-query'
import { SubscriptionManager } from './subscription-manager';
import { convertToPocketBaseFilter, convertToPocketBaseSort } from './pocketbase-query-converter';
import './query-builder-extensions';
import { getCollectionExpand } from './query-builder-extensions';
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
 * Extended LoadSubsetOptions that includes PocketBase-specific expand parameter.
 * @internal
 */
type ExtendedLoadSubsetOptions = LoadSubsetOptions & {
    pbExpand?: string;
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
 * Internal helper to create a single collection with all enhancements.
 * Extracted from the old CollectionFactory.create() method.
 * @internal
 */

// class Extended

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

    // Mutable reference to store the collection once created
    // This allows queryFn to access the collection for WeakMap lookups
    let collectionRef: any = null;

    const collectionOptions = queryCollectionOptions<RecordType>({
        queryClient,
        queryKey: [collectionName],
        syncMode: options?.syncMode ?? 'on-demand',
        queryFn: async (ctx) => {
            const loadOptions = ctx.meta?.loadSubsetOptions as ExtendedLoadSubsetOptions | undefined;
            const filter = convertToPocketBaseFilter(loadOptions?.where);
            const sort = convertToPocketBaseSort(loadOptions?.orderBy);
            const limit = loadOptions?.limit;
            // Check for expand from collection's WeakMap (set by query-level .expand())
            const queryLevelExpand = collectionRef ? getCollectionExpand(collectionRef) : undefined;
            const expand = loadOptions?.pbExpand || queryLevelExpand;

            if (!filter && !sort && !limit && !expand) {
                const result = await pb
                    .collection(collectionName)
                    .getFullList();
                return result as unknown as RecordType[];
            }

            const result = await pb
                .collection(collectionName)
                .getList(1, limit || 500, {
                    filter,
                    sort,
                    expand,
                });
            return result.items as unknown as RecordType[];
        },
        getKey: (item: RecordType) => {
            const record = item as any;
            if (!record || typeof record !== 'object' || !('id' in record)) {
                throw new Error(`Record in collection '${collectionName}' is missing required 'id' field. Received: ${JSON.stringify(item)}`);
            }
            return record.id;
        },
        onInsert: options?.onInsert === false ? undefined : options?.onInsert ?? (async ({ transaction }) => {
            await Promise.all(
                transaction.mutations.map(async (mutation) => {
                    const { id, created, updated, collectionId, collectionName: _, ...data } = mutation.modified as Record<string, unknown>;
                    await pb.collection(collectionName).create(data);
                })
            );
        }),
        onUpdate: options?.onUpdate === false ? undefined : options?.onUpdate ?? (async ({ transaction }) => {
            await Promise.all(
                transaction.mutations.map(async (mutation) => {
                    const recordWithId = mutation.original as { id: string };
                    await pb.collection(collectionName).update(recordWithId.id, mutation.changes);
                })
            );
        }),
        onDelete: options?.onDelete === false ? undefined : options?.onDelete ?? (async ({ transaction }) => {
            await Promise.all(
                transaction.mutations.map(async (mutation) => {
                    const recordWithId = mutation.original as { id: string };
                    await pb.collection(collectionName).delete(recordWithId.id);
                })
            );
        }),
    });

    const baseCollection = createTanStackCollection(collectionOptions);

    // Set the collection reference for queryFn to use
    collectionRef = baseCollection;

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
        // Internal method for query-level expand (no validation)
        __expandInternal: (fields: string[]) => {
            return createExpandedCollection(pb, queryClient, collectionName, fields);
        },
        expand: <Fields extends (keyof ExtractRelations<Schema, C> & string)[]>(
            ...fields: Fields
        ): Collection<WithExpandFromArray<RecordType, Schema, C, Fields>> => {
            const expandableKeys = Object.keys(options?.expandable || []);
            for (const field of fields) {
                if (!expandableKeys.includes(field)) {
                    throw new Error(
                        `Field '${field}' is not in expandable config for collection '${collectionName}'. ` +
                            `Available fields: ${expandableKeys.join(', ')}`
                    );
                }
            }

            const sortedFields = [...fields].sort();
            const expandString = sortedFields.join(',');

            type ExpandedRecordType = WithExpandFromArray<RecordType, Schema, C, Fields>;

            const expandedCollectionOptions = queryCollectionOptions<ExpandedRecordType>({
                queryClient,
                queryKey: [collectionName, 'expand', expandString],
                syncMode: options?.syncMode ?? 'on-demand',
                queryFn: async (ctx) => {
                    const loadOptions = ctx.meta?.loadSubsetOptions as ExtendedLoadSubsetOptions | undefined;
                    const filter = convertToPocketBaseFilter(loadOptions?.where);
                    const sort = convertToPocketBaseSort(loadOptions?.orderBy);
                    const limit = loadOptions?.limit;
                    const queryExpand = loadOptions?.pbExpand;

                    // Query-level expand takes precedence over collection-level expand
                    const finalExpand = queryExpand || expandString;

                    if (!filter && !sort && !limit && !queryExpand) {
                        const result = await pb
                            .collection(collectionName)
                            .getFullList({ expand: finalExpand });
                        return result as unknown as ExpandedRecordType[];
                    }

                    const result = await pb
                        .collection(collectionName)
                        .getList(1, limit || 500, {
                            filter,
                            sort,
                            expand: finalExpand,
                        });
                    return result.items as unknown as ExpandedRecordType[];
                },
                getKey: (item: ExpandedRecordType) => (item as { id: string }).id,
            });

            const expandedCollection = createTanStackCollection(expandedCollectionOptions);

            return expandedCollection;
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
 * Creates an expanded collection without expandable config validation.
 * Used by query-level expand() operator.
 * @internal
 */
export function createExpandedCollection<T extends object>(
    pb: PocketBase,
    queryClient: QueryClient,
    collectionName: string,
    expandFields: string[]
): Collection<T> {
    const sortedFields = [...expandFields].sort();
    const expandString = sortedFields.join(',');

    const expandedCollectionOptions = queryCollectionOptions<T>({
        queryClient,
        queryKey: [collectionName, 'expand', expandString],
        syncMode: 'on-demand',
        queryFn: async (ctx) => {
            const loadOptions = ctx.meta?.loadSubsetOptions as ExtendedLoadSubsetOptions | undefined;
            const filter = convertToPocketBaseFilter(loadOptions?.where);
            const sort = convertToPocketBaseSort(loadOptions?.orderBy);
            const limit = loadOptions?.limit;

            if (!filter && !sort && !limit) {
                const result = await pb
                    .collection(collectionName)
                    .getFullList({ expand: expandString });
                return result as unknown as T[];
            }

            const result = await pb
                .collection(collectionName)
                .getList(1, limit || 500, {
                    filter,
                    sort,
                    expand: expandString,
                });
            return result.items as unknown as T[];
        },
        getKey: (item: T) => (item as { id: string }).id,
    });

    return createTanStackCollection(expandedCollectionOptions);
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
 * const booksWithAuthor = booksCollection.expand('author');
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

