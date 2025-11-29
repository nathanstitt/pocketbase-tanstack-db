import PocketBase from 'pocketbase';
import { createCollection as createTanStackCollection, type Collection, type LoadSubsetOptions } from "@tanstack/react-db"
import { queryCollectionOptions } from "@tanstack/query-db-collection"
import { QueryClient } from '@tanstack/react-query'
import { SubscriptionManager } from './subscription-manager';
import { convertToPocketBaseFilter, convertToPocketBaseSort } from './pocketbase-query-converter';
import type {
    SchemaDeclaration,
    SubscribableCollection,
    CreateCollectionOptions,
    ExtractRecordType,
    ExpandTargetCollection,
    BaseRecord,
} from './types';
import { logger } from './logger';

export type {
    SchemaDeclaration,
    SubscribableCollection,
    CreateCollectionOptions,
    BaseRecord,
} from './types';

/**
 * Extended LoadSubsetOptions that includes PocketBase-specific expand parameter.
 * @internal
 */
type ExtendedLoadSubsetOptions = LoadSubsetOptions & {
    pbExpand?: string;
};

/**
 * Compute the record type with expand property when expand option is configured.
 * @internal
 */
type WithExpandFromConfig<
    Schema extends SchemaDeclaration,
    C extends keyof Schema,
    Opts
> = Opts extends { expand: infer E }
    ? ExtractRecordType<Schema, C> & {
        expand?: {
            [K in keyof E]: K extends keyof import('./types').ExtractRelations<Schema, C>
                ? import('./types').ExtractRelations<Schema, C>[K] extends Array<infer U>
                    ? U[]
                    : import('./types').ExtractRelations<Schema, C>[K]
                : never;
        };
    }
    : ExtractRecordType<Schema, C>;

/**
 * Inferred collection type from config options.
 * @internal
 */
type InferCollectionType<
    Schema extends SchemaDeclaration,
    C extends keyof Schema,
    Opts extends CreateCollectionOptions<Schema, C>
> = Collection<
    WithExpandFromConfig<Schema, C, Opts>,
    string | number,
    // TUtils - use default from TanStack DB (includes writeBatch, writeUpsert, etc.)
    Record<string, (...args: unknown[]) => unknown>,
    // TSchema - we don't use StandardSchema validation
    never,
    Opts extends { omitOnInsert: infer O extends readonly import('./types').OmittableFields<ExtractRecordType<Schema, C>>[] }
        ? import('./types').ComputeInsertType<ExtractRecordType<Schema, C>, O>
        : ExtractRecordType<Schema, C>
> &
   SubscribableCollection<WithExpandFromConfig<Schema, C, Opts>>;

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
 * Creates a type-safe TanStack DB collection backed by PocketBase.
 * Use this when you need fine-grained control or need to create collections with dependencies.
 *
 * @param pb - PocketBase client instance
 * @param queryClient - TanStack Query client
 * @returns A curried function that takes collection name and options
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
 * With auto-expand relations:
 * ```ts
 * const authorsCollection = createCollection<Schema>(pb, queryClient)('authors', {});
 * const booksCollection = createCollection<Schema>(pb, queryClient)('books', {
 *     expand: {
 *         author: authorsCollection  // Always expand, auto-upsert into authorsCollection
 *     }
 * });
 *
 * // Expand is automatic - no .expand() call needed
 * const { data } = useLiveQuery((q) => q.from({ books: booksCollection }));
 * // data[0].expand.author is typed and populated
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
        type RecordType = ExtractRecordType<Schema, C>;
        const expandStores = options?.expand as Record<string, ExpandTargetCollection> | undefined;
        const expandString = expandStores ? Object.keys(expandStores).sort().join(',') : undefined;

        async function fetchRecords(loadOptions?: ExtendedLoadSubsetOptions): Promise<RecordType[]> {
            const filter = convertToPocketBaseFilter(loadOptions?.where);
            const sort = convertToPocketBaseSort(loadOptions?.orderBy);
            const limit = loadOptions?.limit;

            let items: RecordType[];
            if (!filter && !sort && !limit && !expandString) {
                items = await pb.collection(collectionName).getFullList() as unknown as RecordType[];
            } else {
                const result = await pb.collection(collectionName).getList(1, limit || 500, {
                    filter,
                    sort,
                    expand: expandString,
                });
                items = result.items as unknown as RecordType[];
            }

            if (expandStores) {
                for (const record of items) {
                    const expandData = (record as RecordType & { expand?: Record<string, object | object[]> }).expand;
                    if (!expandData) continue;

                    for (const [key, value] of Object.entries(expandData)) {
                        const targetStore = expandStores[key];
                        if (!targetStore.utils) continue;
                        if (!targetStore.isReady()) {
                            if (targetStore.config?.syncMode === 'on-demand') {
                                await targetStore._sync.startSync();
                            } else {
                                logger.warn(`not syncing ${key} on ${collectionName} because store is not yet ready`)
                                continue
                            }
                        }
                        const values = Array.isArray(value) ? value : [value];
                        targetStore.utils.writeUpsert(values);
                    }
                }
            }

            return items;
        }

        const collectionOptions = queryCollectionOptions({
            queryClient,
            queryKey: [collectionName],
            syncMode: options?.syncMode ?? 'eager',
            queryFn: async (ctx): Promise<RecordType[]> => {
                return fetchRecords(ctx.meta?.loadSubsetOptions as ExtendedLoadSubsetOptions | undefined);
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
                        const { id, created, updated, collectionId, collectionName: _, ...data } = mutation.modified as unknown as Record<string, unknown>;
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
            })
        });

        const collection = createTanStackCollection(collectionOptions);

        Object.assign(collection, {
            collectionName,
            subscribe: async (recordId?: string) => {
                await subscriptionManager.subscribe(collectionName, collection, recordId);
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
        });

        collection.on('subscribers:change', (event: { subscriberCount: number; previousSubscriberCount: number }) => {
            const newCount = event.subscriberCount;
            const previousCount = event.previousSubscriberCount;

            if (newCount > previousCount) {
                subscriptionManager.addSubscriber(collectionName, collection).catch(() => {});
            } else if (newCount < previousCount) {
                subscriptionManager.removeSubscriber(collectionName);
            }
        });

        return collection as any;
    };
}

