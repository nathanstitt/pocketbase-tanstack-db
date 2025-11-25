/**
 * Query builder extensions for PocketBase-specific features.
 * This module extends TanStack DB's QueryIR and BaseQueryBuilder with type-safe expand() support.
 */

import { BaseQueryBuilder } from '@tanstack/db';
import type { Context } from '@tanstack/db';
import type { SchemaDeclaration } from './types';

/**
 * WeakMap to store expand configuration for collections.
 * Maps collection -> expand string.
 * This allows passing expand info without modifying the query IR structure.
 */
const collectionExpandMap = new WeakMap<any, string>();

/**
 * Get the expand configuration for a collection, if any.
 * Used internally by collection queryFn to check if expand should be applied.
 * @internal
 */
export function getCollectionExpand(collection: any): string | undefined {
    return collectionExpandMap.get(collection);
}

/**
 * Set the expand configuration for a collection.
 * @internal
 */
function setCollectionExpand(collection: any, expandString: string): void {
    collectionExpandMap.set(collection, expandString);
}

/**
 * Augment TanStack DB's QueryIR to include PocketBase expand parameter.
 * This allows expand information to be stored in the query intermediate representation.
 */
declare module '@tanstack/db' {
    namespace IR {
        interface QueryIR {
            /**
             * PocketBase expand parameter for expanding relations.
             * Array of relation field names.
             */
            pbExpand?: string;
        }
    }
}

/**
 * Utility type to extract relation types from schema for a collection.
 * @internal
 */
type ExtractRelationsForCollection<
    Schema extends SchemaDeclaration,
    CollectionName extends keyof Schema
> = Schema[CollectionName] extends { relations: infer R } ? R : never;

/**
 * Build the expand object type from an array of field names.
 * Maps each field name to its corresponding relation type from the schema.
 * @internal
 */
type BuildExpandType<
    Schema extends SchemaDeclaration,
    CollectionName extends keyof Schema,
    Fields extends readonly string[]
> = {
    [K in Fields[number]]: K extends keyof ExtractRelationsForCollection<Schema, CollectionName>
        ? ExtractRelationsForCollection<Schema, CollectionName>[K]
        : never;
};

/**
 * Add expand property to the result type.
 * @internal
 */
type WithExpandProperty<
    TResult,
    Schema extends SchemaDeclaration,
    CollectionName extends keyof Schema,
    Fields extends readonly string[]
> = TResult & {
    expand?: BuildExpandType<Schema, CollectionName, Fields>;
};

/**
 * Extract collection name from the context's fromSourceName.
 * @internal
 */
type GetCollectionNameFromContext<TContext extends Context> =
    TContext['fromSourceName'];

/**
 * Get the result type from context (handling both explicit result and inferred).
 * @internal
 */
type GetResult<TContext extends Context> =
    TContext['result'] extends object
        ? TContext['result']
        : TContext['schema'][TContext['fromSourceName']];

/**
 * Create a new context with expand applied to the result type.
 * @internal
 */
type WithExpandedResult<
    TContext extends Context,
    Schema extends SchemaDeclaration,
    CollectionName extends keyof Schema,
    Fields extends readonly string[]
> = Omit<TContext, 'result'> & {
    result: WithExpandProperty<GetResult<TContext>, Schema, CollectionName, Fields>;
};

/**
 * Extend BaseQueryBuilder with type-safe expand() method.
 * This allows chaining like: q.from({ books }).expand<Schema, 'books'>('author', 'publisher')
 */
declare module '@tanstack/db' {
    interface BaseQueryBuilder<TContext extends Context = Context> {
        /**
         * Specify which PocketBase relations to expand in the query results.
         * This adds an expand parameter to the PocketBase API call and properly types the result.
         *
         * @template Schema - Your PocketBase schema declaration
         * @template C - Collection name (inferred from context)
         * @param fields - Variadic relation field names to expand
         * @returns A QueryBuilder with expand applied and properly typed results
         *
         * @example
         * ```ts
         * // Expand a single relation
         * query
         *   .from({ books: booksCollection })
         *   .expand<Schema, 'books'>('author')
         *
         * // Expand multiple relations
         * query
         *   .from({ books: booksCollection })
         *   .expand<Schema, 'books'>('author', 'publisher')
         *
         * // Result is fully typed:
         * const { data } = useLiveQuery((q) =>
         *   q.from({ books }).expand<Schema, 'books'>('author')
         * );
         * // data[0].expand.author is typed as Authors
         * ```
         */
        expand<
            Schema extends SchemaDeclaration = SchemaDeclaration,
            C extends keyof Schema & string = Extract<TContext['fromSourceName'], keyof Schema & string>,
            Fields extends readonly (keyof ExtractRelationsForCollection<Schema, C> & string)[] =
                readonly (keyof ExtractRelationsForCollection<Schema, C> & string)[]
        >(
            ...fields: Fields
        ): QueryBuilder<WithExpandedResult<TContext, Schema, C, Fields>>;
    }
}

type QueryBuilder<TContext extends Context> = Omit<BaseQueryBuilder<TContext>, 'from' | '_getQuery'>;

/**
 * Runtime implementation of expand() method.
 * This modifies the BaseQueryBuilder prototype to add the expand functionality.
 *
 * Uses a WeakMap to store expand configuration on the collection, avoiding
 * the need to modify the query IR or create new collections.
 */
(BaseQueryBuilder.prototype as any).expand = function <
    Schema extends SchemaDeclaration,
    C extends keyof Schema & string,
    Fields extends readonly string[]
>(...fields: Fields): any {
    // Get current query IR
    const currentQuery = (this as any)._getQuery();

    // Get the source collection from the query
    const sources = currentQuery.from;
    if (!sources || Object.keys(sources).length === 0) {
        throw new Error('expand() must be called after from()');
    }

    // Get the first (and should be only) source collection
    const sourceKey = Object.keys(sources)[0];
    const sourceCollection = sources[sourceKey];

    // Check if this is a pbtsdb collection
    if (typeof (sourceCollection as any).__expandInternal !== 'function') {
        throw new Error(`Collection does not support expand(). Make sure you're using a pbtsdb collection.`);
    }

    // Sort fields for consistent expand string
    const sortedFields = [...fields].sort();
    const expandString = sortedFields.join(',');

    // Store the expand configuration in the WeakMap
    // The collection's queryFn will check this when executing
    setCollectionExpand(sourceCollection, expandString);

    // Return this builder unchanged - the collection will handle expand internally
    return this;
};

/**
 * Factory result containing typed expand helpers.
 */
export interface ExpandFactory<Schema extends SchemaDeclaration> {
    /**
     * Apply expand to a query builder with pre-bound Schema type.
     *
     * @template C - Collection name from Schema
     * @template Fields - Array of relation field names to expand
     * @param builder - The query builder to apply expand to
     * @param collectionName - Name of the collection
     * @param fields - Relation fields to expand
     * @returns Query builder with expanded results
     *
     * @example
     * ```ts
     * const { expand } = createExpandFactory<Schema>();
     *
     * // Use with query builder
     * const query = expand(
     *     q.from({ books: booksCollection }),
     *     'books',
     *     'author'
     * );
     * ```
     */
    expand<
        C extends keyof Schema & string,
        Fields extends readonly (keyof ExtractRelationsForCollection<Schema, C> & string)[]
    >(
        builder: any,
        collectionName: C,
        ...fields: Fields
    ): any;

    /**
     * Curried expand helper that returns a function to apply to a query builder.
     * This allows for more flexible composition patterns.
     *
     * @template C - Collection name from Schema
     * @param collectionName - Name of the collection
     * @returns Function that takes fields and returns a function to apply expand
     *
     * @example
     * ```ts
     * const { expandFor } = createExpandFactory<Schema>();
     *
     * // Create reusable expand configuration
     * const expandBooksAuthor = expandFor('books')('author');
     *
     * // Apply to multiple queries
     * const query1 = expandBooksAuthor(q.from({ books: booksCollection }));
     * const query2 = expandBooksAuthor(q.from({ books: booksCollection2 }));
     * ```
     */
    expandFor<C extends keyof Schema & string>(
        collectionName: C
    ): <Fields extends readonly (keyof ExtractRelationsForCollection<Schema, C> & string)[]>(
        ...fields: Fields
    ) => (builder: any) => any;
}

/**
 * **EXPERIMENTAL:** Creates a factory with Schema-bound expand helpers.
 *
 * ⚠️ **Note:** This factory API is experimental and may not work correctly in all cases.
 * The recommended approach is to use the direct expand() method on query builders:
 * ```ts
 * q.from({ books }).expand<Schema, 'books'>('author')
 * ```
 *
 * This factory approach may have issues with how TanStack DB propagates custom IR fields
 * through the query execution pipeline. Use at your own risk and verify behavior in your
 * specific use case.
 *
 * @template Schema - Your PocketBase schema declaration
 * @returns Object containing typed expand helper functions
 *
 * @example
 * Recommended approach (direct method):
 * ```ts
 * const { result } = renderHook(() =>
 *     useLiveQuery((q) =>
 *         q.from({ books: booksCollection }).expand<Schema, 'books'>('author')
 *     )
 * );
 * ```
 *
 * @example
 * Experimental factory approach (may not work):
 * ```ts
 * const { expand } = createExpandFactory<Schema>();
 *
 * const { result } = renderHook(() =>
 *     useLiveQuery((q) =>
 *         expand(q.from({ books: booksCollection }), 'books', 'author')
 *     )
 * );
 * ```
 */
export function createExpandFactory<Schema extends SchemaDeclaration>(): ExpandFactory<Schema> {
    function expand<
        C extends keyof Schema & string,
        Fields extends readonly (keyof ExtractRelationsForCollection<Schema, C> & string)[]
    >(
        builder: any,
        collectionName: C,
        ...fields: Fields
    ): any {
        return (builder as any).expand(...fields);
    }

    function expandFor<C extends keyof Schema & string>(
        collectionName: C
    ) {
        return <Fields extends readonly (keyof ExtractRelationsForCollection<Schema, C> & string)[]>(
            ...fields: Fields
        ) => {
            return (builder: any) => {
                return expand(builder, collectionName, ...fields);
            };
        };
    }

    return {
        expand,
        expandFor,
    };
}
