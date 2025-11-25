import type { Collection, InsertMutationFn, UpdateMutationFn, DeleteMutationFn } from "@tanstack/db"
import type { UnsubscribeFunc } from 'pocketbase';

// ============================================================================
// Schema Type Definitions
// ============================================================================

/**
 * Schema declaration for type-safe collection management.
 * Define your PocketBase collections with their record types and relations.
 *
 * @example
 * ```ts
 * interface MySchema extends SchemaDeclaration {
 *     users: {
 *         type: UserRecord;
 *         relations: {
 *             org: OrgRecord;
 *         };
 *     };
 * }
 * ```
 */
export interface SchemaDeclaration {
    [collectionName: string]: {
        type: object;
        relations?: {
            [fieldName: string]: object | object[];
        };
    };
}

// ============================================================================
// Subscription Types
// ============================================================================

/**
 * PocketBase real-time event structure.
 * Matches RecordSubscription from the PocketBase SDK.
 */
export interface RealtimeEvent<T extends object = object> {
    action: string;
    record: T;
}

/**
 * Internal state tracking for subscription management.
 * Includes reconnection logic and record-specific subscriptions.
 */
export interface SubscriptionState {
    unsubscribe: UnsubscribeFunc;
    recordId?: string;
    reconnectAttempts: number;
    isReconnecting: boolean;
}

/**
 * Enhanced collection interface with subscription management capabilities.
 * Provides methods to control real-time updates from PocketBase.
 */
export interface SubscribableCollection<T extends object = object> {
    /**
     * Subscribe to real-time updates for this collection.
     * @param recordId - Optional: Subscribe to a specific record, or omit for collection-wide updates
     */
    subscribe: (recordId?: string) => Promise<void>;

    /**
     * Unsubscribe from real-time updates.
     * @param recordId - Optional: Unsubscribe from a specific record, or omit for collection-wide
     */
    unsubscribe: (recordId?: string) => void;

    /**
     * Unsubscribe from all subscriptions for this collection.
     */
    unsubscribeAll: () => void;

    /**
     * Check if currently subscribed to updates.
     * @param recordId - Optional: Check a specific record subscription, or omit for collection-wide
     */
    isSubscribed: (recordId?: string) => boolean;

    /**
     * Wait for a subscription to be fully established (useful for testing).
     * @param recordId - Optional record ID
     * @param timeoutMs - Timeout in milliseconds (default: 5000)
     */
    waitForSubscription: (recordId?: string, timeoutMs?: number) => Promise<void>;
}

// ============================================================================
// Collection Enhancement Types
// ============================================================================

/**
 * Join helper for type-safe TanStack DB joins.
 * Provides access to pre-configured relation collections.
 */
export interface JoinHelper<
    Schema extends SchemaDeclaration,
    CollectionName extends keyof Schema,
    RecordType extends object
> {
    /**
     * Get a pre-configured collection for joining a relation field.
     * This returns the related collection that can be used with TanStack DB's .join() method.
     *
     * @param fieldName - The relation field name to join
     * @returns The collection for the related entity, or undefined if not configured
     *
     * @example
     * ```ts
     * const customersCollection = createCollection<Schema>(pb, queryClient)('customers');
     * const addressesCollection = createCollection<Schema>(pb, queryClient)('addresses');
     *
     * const jobsCollection = createCollection<Schema>(pb, queryClient)('jobs', {
     *     relations: {
     *         customer: customersCollection,
     *         address: addressesCollection
     *     }
     * });
     *
     * // Use with TanStack DB joins
     * const query = q.from({ job: jobsCollection })
     *     .join(
     *         { customer: jobsCollection.relations.customer },
     *         ({ job, customer }) => eq(job.customer, customer.id),
     *         'left'
     *     );
     * ```
     */
    relations: RelationsConfig<Schema, CollectionName>;
}

/**
 * Enhanced collection interface with query-time expand capabilities.
 * Allows selecting which relations to expand per-query with automatic insertion into target collections.
 */
export interface ExpandableCollection<
    Schema extends SchemaDeclaration,
    CollectionName extends keyof Schema,
    RecordType extends object
> {
    /**
     * Create a collection variant with specified relations expanded.
     * The expanded records are automatically inserted into their target collections.
     *
     * @param fields - Array of relation field names to expand (must be defined in expandable config)
     * @returns A collection variant with the specified fields expanded
     *
     * @example
     * ```ts
     * const customersCollection = createCollection<Schema>(pb, queryClient)('customers');
     * const addressesCollection = createCollection<Schema>(pb, queryClient)('addresses');
     * const tagsCollection = createCollection<Schema>(pb, queryClient)('tags');
     *
     * const jobsCollection = createCollection<Schema>(pb, queryClient)('jobs', {
     *     expandable: {
     *         customer: customersCollection,
     *         address: addressesCollection,
     *         tags: tagsCollection
     *     }
     * });
     *
     * // Expand only customer
     * const { data } = useLiveQuery((q) =>
     *     q.from({ jobs: jobsCollection.expand('customer') })
     * );
     * // data[0].expand.customer is typed and available
     * // customersCollection also contains the expanded customer records
     *
     * // Expand multiple relations
     * const { data: detailed } = useLiveQuery((q) =>
     *     q.from({ jobs: jobsCollection.expand('customer', 'address') })
     * );
     * ```
     */
    expand<Fields extends (keyof ExtractRelations<Schema, CollectionName> & string)[]>(
        ...fields: Fields
    ): Collection<WithExpandFromArray<RecordType, Schema, CollectionName, Fields>>;
}

// ============================================================================
// Schema Extraction Utilities
// ============================================================================

/**
 * Extracts the record type from a schema collection.
 * @internal
 */
export type ExtractRecordType<
    Schema extends SchemaDeclaration,
    CollectionName extends keyof Schema
> = Schema[CollectionName]['type'];

/**
 * Computes the insert input type by making specified fields optional.
 * Used to support omitting server-generated fields (created, updated) during insertion.
 *
 * IMPORTANT: The 'id' field can NEVER be omitted as TanStack DB requires it for record tracking.
 *
 * @example
 * ```ts
 * type BookInsert = ComputeInsertType<Books, ['created', 'updated']>
 * // Result: Omit<Books, 'created' | 'updated'> & Partial<Pick<Books, 'created' | 'updated'>>
 * ```
 * @internal
 */
export type ComputeInsertType<
    T extends object,
    OmitFields extends readonly (Exclude<keyof T, 'id'>)[]
> = Omit<T, OmitFields[number]> & Partial<Pick<T, OmitFields[number]>>;

/**
 * Extracts the relations object from a schema collection.
 * Returns never if the collection has no relations defined.
 * @internal
 */
export type ExtractRelations<
    Schema extends SchemaDeclaration,
    CollectionName extends keyof Schema
> = Schema[CollectionName] extends { relations: infer R } ? R : never;

/**
 * Extracts expandable field names from a schema collection.
 * Returns the union of all relation field names that can be expanded.
 * @internal
 */
export type ExpandableFields<
    Schema extends SchemaDeclaration,
    CollectionName extends keyof Schema
> = ExtractRelations<Schema, CollectionName> extends never
    ? never
    : keyof ExtractRelations<Schema, CollectionName> & string;

// ============================================================================
// Expand Type Utilities
// ============================================================================

/**
 * Parses comma-separated relation field names into a union type.
 * Recursively processes "field1,field2,field3" into "field1" | "field2" | "field3".
 *
 * @example
 * ParseExpandFields<"customer,address"> => "customer" | "address"
 * @internal
 */
export type ParseExpandFields<T extends string> =
    T extends `${infer Field},${infer Rest}`
        ? Field | ParseExpandFields<Rest>
        : T;

/**
 * Builds the expand object type based on field names.
 * If expand fields are provided, adds an optional `expand` property with properly typed relations.
 *
 * @example
 * ```ts
 * // Without expand
 * WithExpand<Schema, 'jobs', undefined> => JobRecord
 *
 * // With expand
 * WithExpand<Schema, 'jobs', 'customer'> => JobRecord & {
 *     expand?: { customer?: CustomerRecord }
 * }
 * ```
 */
export type WithExpand<
    Schema extends SchemaDeclaration,
    CollectionName extends keyof Schema,
    ExpandFields extends string | undefined
> = ExpandFields extends string
    ? ExtractRecordType<Schema, CollectionName> & {
        expand?: {
            [K in ParseExpandFields<ExpandFields>]?: K extends keyof ExtractRelations<Schema, CollectionName>
                ? ExtractRelations<Schema, CollectionName>[K] extends Array<infer U>
                    ? U[]  // Array relation
                    : ExtractRelations<Schema, CollectionName>[K]  // Single relation
                : never;
        };
    }
    : ExtractRecordType<Schema, CollectionName>;

/**
 * Builds the expand object type based on an array of field names.
 * Used for query-time expand where fields are specified as an array.
 *
 * @example
 * ```ts
 * WithExpandFromArray<JobRecord, Schema, 'jobs', ['customer', 'address']> => JobRecord & {
 *     expand?: {
 *         customer?: CustomerRecord;
 *         address?: AddressRecord;
 *     }
 * }
 * ```
 * @internal
 */
export type WithExpandFromArray<
    T extends object,
    Schema extends SchemaDeclaration,
    CollectionName extends keyof Schema,
    Fields extends readonly string[]
> = T & {
    expand?: {
        [K in Fields[number]]: K extends keyof ExtractRelations<Schema, CollectionName>
            ? ExtractRelations<Schema, CollectionName>[K] extends Array<infer U>
                ? U[]  // Array relation
                : ExtractRelations<Schema, CollectionName>[K]  // Single relation
            : never;
    };
};

// ============================================================================
// Relation Type Utilities
// ============================================================================

/**
 * Removes undefined from a union type.
 * Used to unwrap optional relation types.
 *
 * @example
 * NonNullable<Customer | undefined> => Customer
 * @internal
 */
export type NonNullable<T> = T extends (infer U) | undefined ? U : T;

/**
 * Extracts the output type from a Collection type.
 * @internal
 */
type ExtractCollectionOutput<C> = C extends Collection<infer TOutput, any, any, any, any> ? TOutput : never;

/**
 * Converts a schema relation type to its corresponding Collection constraint.
 * Handles both single relations (T) and array relations (T[]).
 * Accepts collections with any insert type to support omitOnInsert configurations.
 *
 * Uses constraint (extends Collection<T, ...>) rather than exact type to allow
 * collections with different TInput types (from omitOnInsert) to be compatible.
 *
 * @example
 * RelationAsCollection<Customer> => Collection<Customer, string | number, any, any, any>
 * RelationAsCollection<Customer[]> => Collection<Customer, string | number, any, any, any>
 * @internal
 */
export type RelationAsCollection<T> =
    T extends Array<infer U>
        ? U extends object ? Collection<U, string | number, any, any, any> : Collection<object, string | number, any, any, any>
        : T extends object ? Collection<T, string | number, any, any, any> : Collection<object, string | number, any, any, any>;

/**
 * Configuration for relations - maps field names to their TanStack DB collections.
 * Used to provide pre-configured collections for manual joins.
 *
 * @example
 * ```ts
 * const customersCollection = createCollection<Schema>(pb, queryClient)('customers');
 * const addressesCollection = createCollection<Schema>(pb, queryClient)('addresses');
 *
 * const jobsCollection = createCollection<Schema>(pb, queryClient)('jobs', {
 *     relations: {
 *         customer: customersCollection,
 *         address: addressesCollection
 *     }
 * });
 * ```
 */
export type RelationsConfig<
    Schema extends SchemaDeclaration,
    CollectionName extends keyof Schema
> = ExtractRelations<Schema, CollectionName> extends never
    ? Record<string, never>
    : Partial<{
        [K in keyof ExtractRelations<Schema, CollectionName>]: RelationAsCollection<
            NonNullable<ExtractRelations<Schema, CollectionName>[K]>
        >;
    }>;

/**
 * Configuration for expandable relations - maps relation field names to their target collections.
 * Used to define which relations CAN be expanded at query time with auto-insertion into target collections.
 *
 * @example
 * ```ts
 * const customersCollection = createCollection<Schema>(pb, queryClient)('customers');
 * const addressesCollection = createCollection<Schema>(pb, queryClient)('addresses');
 * const tagsCollection = createCollection<Schema>(pb, queryClient)('tags');
 *
 * const jobsCollection = createCollection<Schema>(pb, queryClient)('jobs', {
 *     expandable: {
 *         customer: customersCollection,
 *         address: addressesCollection,
 *         tags: tagsCollection
 *     }
 * });
 * ```
 */
export type ExpandableConfig<
    Schema extends SchemaDeclaration,
    CollectionName extends keyof Schema
> = ExtractRelations<Schema, CollectionName> extends never
    ? Record<string, never>
    : Partial<{
        [K in keyof ExtractRelations<Schema, CollectionName>]: RelationAsCollection<
            NonNullable<ExtractRelations<Schema, CollectionName>[K]>
        >;
    }>;

// ============================================================================
// Configuration Options
// ============================================================================

/**
 * Options for creating a collection with optional expandable and relations.
 */
export interface CreateCollectionOptions<
    Schema extends SchemaDeclaration,
    CollectionName extends keyof Schema
> {
    /**
     * Pre-configured relation collections for manual TanStack DB joins.
     *
     * @example
     * ```ts
     * const customersCollection = createCollection<Schema>(pb, queryClient)('customers');
     * const addressesCollection = createCollection<Schema>(pb, queryClient)('addresses');
     *
     * const jobsCollection = createCollection<Schema>(pb, queryClient)('jobs', {
     *     relations: {
     *         customer: customersCollection,
     *         address: addressesCollection
     *     }
     * });
     * ```
     */
    relations?: RelationsConfig<Schema, CollectionName>;

    /**
     * Define which relations CAN be expanded at query time.
     * Maps relation field names to their target collections for auto-insertion.
     *
     * When specified, enables the `.expand()` method on the collection that allows
     * query-time selection of which relations to expand. Expanded records are
     * automatically inserted into their target collections.
     *
     * @example
     * ```ts
     * const customersCollection = createCollection<Schema>(pb, queryClient)('customers');
     * const addressesCollection = createCollection<Schema>(pb, queryClient)('addresses');
     *
     * const jobsCollection = createCollection<Schema>(pb, queryClient)('jobs', {
     *     expandable: {
     *         customer: customersCollection,
     *         address: addressesCollection
     *     }
     * });
     *
     * // In query - choose which to expand
     * const { data } = useLiveQuery((q) =>
     *     q.from({ jobs: jobsCollection.expand('customer') })
     * );
     * ```
     */
    expandable?: ExpandableConfig<Schema, CollectionName>;

    /**
     * Whether to automatically sync (fetch) data when the collection is created.
     * Default: false (lazy - sync starts after first query becomes active).
     *
     * @example
     * ```ts
     * // Lazy loading (default) - sync starts after query
     * const jobsCollection = createCollection<Schema>(pb, queryClient)('jobs');
     * // or explicitly:
     * const jobsCollection = createCollection<Schema>(pb, queryClient)('jobs', { startSync: false });
     *
     * // Eager loading - sync starts immediately on creation
     * const jobsCollection = createCollection<Schema>(pb, queryClient)('jobs', {
     *     startSync: true
     * });
     * ```
     */
    startSync?: boolean;

    /**
     * Fields that can be omitted during insert operations.
     * Useful for server-generated fields like 'created', 'updated'.
     *
     * When specified, the insert() method will accept records without these fields,
     * and the omitted fields become optional in the insert input type.
     *
     * **Type safety:** Only valid field names from the record type are accepted.
     * **IMPORTANT:** The 'id' field can NEVER be omitted as TanStack DB requires it.
     *
     * @example
     * ```ts
     * // Allow inserting without created, updated (server-generated timestamps)
     * const booksCollection = createCollection<Schema>(pb, queryClient)('books', {
     *     omitOnInsert: ['created', 'updated'] as const
     * });
     *
     * // Now insert() accepts records without those fields
     * booksCollection.insert({
     *     id: newRecordId(),  // id is always required
     *     title: 'New Book',
     *     isbn: '1234567890',
     *     genre: 'Fiction',
     *     author: authorId
     *     // created, updated are optional
     * });
     * ```
     */
    omitOnInsert?: readonly (Exclude<keyof ExtractRecordType<Schema, CollectionName>, 'id'>)[];

    /**
     * Custom handler for insert mutations.
     *
     * **Default behavior (not provided):** Automatically creates records in PocketBase,
     * excluding auto-generated fields (id, created, updated, collectionId, collectionName).
     *
     * **Custom handler:** Provide your own handler to customize insert behavior.
     *
     * **Disable:** Set to `false` to disable insert mutations entirely (will throw error if insert is called).
     *
     * @example
     * ```ts
     * // Use default automatic handler (recommended)
     * const collection = createCollection<Schema>(pb, queryClient)('books');
     *
     * // Custom handler
     * const collection = createCollection<Schema>(pb, queryClient)('books', {
     *     onInsert: async ({ transaction }) => {
     *         for (const mutation of transaction.mutations) {
     *             await customInsertLogic(mutation.modified);
     *         }
     *         await queryClient.invalidateQueries({ queryKey: ['books'] });
     *     }
     * });
     *
     * // Disable inserts (read-only collection)
     * const collection = createCollection<Schema>(pb, queryClient)('books', {
     *     onInsert: false
     * });
     * ```
     */
    onInsert?: InsertMutationFn<ExtractRecordType<Schema, CollectionName>> | false;

    /**
     * Custom handler for update mutations.
     *
     * **Default behavior (not provided):** Automatically updates records in PocketBase
     * with the changed fields.
     *
     * **Custom handler:** Provide your own handler to customize update behavior.
     *
     * **Disable:** Set to `false` to disable update mutations entirely (will throw error if update is called).
     *
     * @example
     * ```ts
     * // Use default automatic handler (recommended)
     * const collection = createCollection<Schema>(pb, queryClient)('books');
     *
     * // Custom handler
     * const collection = createCollection<Schema>(pb, queryClient)('books', {
     *     onUpdate: async ({ transaction }) => {
     *         for (const mutation of transaction.mutations) {
     *             await customUpdateLogic(mutation.original.id, mutation.changes);
     *         }
     *         await queryClient.invalidateQueries({ queryKey: ['books'] });
     *     }
     * });
     *
     * // Disable updates (read-only collection)
     * const collection = createCollection<Schema>(pb, queryClient)('books', {
     *     onUpdate: false
     * });
     * ```
     */
    onUpdate?: UpdateMutationFn<ExtractRecordType<Schema, CollectionName>> | false;

    /**
     * Custom handler for delete mutations.
     *
     * **Default behavior (not provided):** Automatically deletes records from PocketBase.
     *
     * **Custom handler:** Provide your own handler to customize delete behavior.
     *
     * **Disable:** Set to `false` to disable delete mutations entirely (will throw error if delete is called).
     *
     * @example
     * ```ts
     * // Use default automatic handler (recommended)
     * const collection = createCollection<Schema>(pb, queryClient)('books');
     *
     * // Custom handler
     * const collection = createCollection<Schema>(pb, queryClient)('books', {
     *     onDelete: async ({ transaction }) => {
     *         for (const mutation of transaction.mutations) {
     *             await customDeleteLogic(mutation.original.id);
     *         }
     *         await queryClient.invalidateQueries({ queryKey: ['books'] });
     *     }
     * });
     *
     * // Disable deletes (read-only collection)
     * const collection = createCollection<Schema>(pb, queryClient)('books', {
     *     onDelete: false
     * });
     * ```
     */
    onDelete?: DeleteMutationFn<ExtractRecordType<Schema, CollectionName>> | false;
}
