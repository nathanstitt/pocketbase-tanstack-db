import React, { createContext, useContext, type ReactNode } from 'react';
import PocketBase from 'pocketbase';
import { QueryClient } from '@tanstack/react-query';
import type { Collection } from '@tanstack/db';
import { CollectionFactory } from './collection';
import type {
    SchemaDeclaration,
    CreateCollectionOptions,
    SubscribableCollection,
    JoinHelper,
    WithExpand,
} from './types';

/**
 * Configuration for a single collection in createReactCollections.
 * Internal type with collection name tracking.
 */
export type CollectionConfig<
    Schema extends SchemaDeclaration,
    CollectionName extends keyof Schema,
    Expand extends string | undefined = undefined
> = CreateCollectionOptions<Schema, CollectionName, Expand> & {
    _collectionName: CollectionName;
    collection?: CollectionName;
};

/**
 * Helper function to define a collection with proper type inference.
 * This function captures the collection name at the type level, enabling
 * perfect type inference without manual type declarations.
 *
 * @param collection - The PocketBase collection name (must match schema)
 * @param options - Optional collection configuration (expand, relations, etc.)
 * @returns A typed collection configuration
 *
 * @example
 * ```typescript
 * const { Provider, useStore } = createReactCollections<Schema>(pb, queryClient, {
 *     books: defineCollection('books', {
 *         expand: 'author' as const
 *     }),
 *     authors: defineCollection('authors', {}),
 * });
 * ```
 */
export function defineCollection<
    Schema extends SchemaDeclaration,
    K extends keyof Schema & string,
    E extends string | undefined = undefined
>(
    collection: K,
    options?: Omit<CreateCollectionOptions<Schema, K, E>, 'collection'>
): CollectionConfig<Schema, K, E> {
    return {
        ...options,
        collection,
        _collectionName: collection,
    } as CollectionConfig<Schema, K, E>;
}

/**
 * Map of config keys to their collection configurations.
 */
export type CollectionsConfig<Schema extends SchemaDeclaration> = Record<
    string,
    {
        _collectionName: keyof Schema & string;
    } & CollectionConfig<Schema, any, any>
>;

/**
 * Infers the Collection type from a CollectionConfig.
 * @internal
 */
type InferCollectionType<
    Schema extends SchemaDeclaration,
    Config extends { _collectionName: keyof Schema }
> = Config extends { _collectionName: infer C } & CollectionConfig<Schema, any, infer E>
    ? C extends keyof Schema
        ? Collection<WithExpand<Schema, C, E>> & SubscribableCollection<WithExpand<Schema, C, E>> & JoinHelper<Schema, C, WithExpand<Schema, C, E>>
        : never
    : never;

/**
 * Builds a map of collection keys to their inferred Collection types.
 * @internal
 */
type InferCollectionsMap<
    Schema extends SchemaDeclaration,
    Config extends CollectionsConfig<Schema>
> = {
    [K in keyof Config]: InferCollectionType<Schema, Config[K]>;
};

/**
 * UseStore hook type for single collection access.
 * @internal
 */
type UseStoreSingle<CollectionsMap> = <K extends keyof CollectionsMap>(
    key: K
) => CollectionsMap[K];

/**
 * UseStore hook type for multiple collection access (variadic).
 * @internal
 */
type UseStoreMultiple<CollectionsMap> = <K extends readonly (keyof CollectionsMap)[]>(
    ...keys: K
) => { [I in keyof K]: K[I] extends keyof CollectionsMap ? CollectionsMap[K[I]] : never };

/**
 * Combined UseStore function type supporting both single and variadic access.
 * @internal
 */
type UseStoreFn<CollectionsMap> = UseStoreSingle<CollectionsMap> & UseStoreMultiple<CollectionsMap>;

/**
 * Return type for createReactCollections function.
 */
export interface ReactCollectionsResult<CollectionsMap> {
    /**
     * React Context Provider component.
     * Wrap your app with this provider to make collections available to useStore.
     */
    Provider: React.FC<{ children: ReactNode }>;

    /**
     * Hook to access collections from the provider.
     * Supports both single and variadic access patterns.
     *
     * @example
     * ```tsx
     * // Single collection
     * const books = useStore('books');
     *
     * // Multiple collections (variadic)
     * const [books, authors] = useStore('books', 'authors');
     * ```
     */
    useStore: UseStoreFn<CollectionsMap>;
}

/**
 * Creates a fully typed React integration for PocketBase collections.
 * This function replaces the old pattern of manual module augmentation with automatic type inference.
 *
 * @param pb - PocketBase client instance
 * @param queryClient - TanStack Query client
 * @param config - Configuration object mapping keys to collection options
 * @returns Object containing Provider component and useStore hook
 *
 * @example
 * Basic usage:
 * ```tsx
 * import { createReactCollections } from 'pbtsdb';
 *
 * type Schema = {
 *     books: {
 *         type: Books;
 *         relations: { author: Authors };
 *     };
 *     authors: {
 *         type: Authors;
 *         relations: {};
 *     };
 * };
 *
 * const { Provider, useStore } = createReactCollections<Schema>(pb, queryClient, {
 *     books: {
 *         expand: 'author' as const
 *     },
 *     authors: {}
 * });
 *
 * // In your app root:
 * <Provider>
 *     <App />
 * </Provider>
 *
 * // In components:
 * function BooksList() {
 *     const books = useStore('books');
 *     const { data } = useLiveQuery((q) => q.from({ books }));
 *     return <div>{data?.map(book => <p key={book.id}>{book.title}</p>)}</div>;
 * }
 * ```
 *
 * @example
 * With collection name override:
 * ```tsx
 * const { Provider, useStore } = createReactCollections<Schema>(pb, queryClient, {
 *     myBooks: {
 *         collection: 'books',  // Key is 'myBooks', but uses 'books' collection
 *         expand: 'author' as const
 *     }
 * });
 *
 * // Access via the key name:
 * const myBooks = useStore('myBooks');
 * ```
 *
 * @example
 * Variadic useStore pattern:
 * ```tsx
 * function BooksWithAuthors() {
 *     const [books, authors] = useStore('books', 'authors');
 *
 *     const { data } = useLiveQuery((q) =>
 *         q.from({ book: books })
 *          .join(
 *              { author: authors },
 *              ({ book, author }) => eq(book.author, author.id),
 *              'left'
 *          )
 *     );
 *
 *     return <div>...</div>;
 * }
 * ```
 */
export function createReactCollections<Schema extends SchemaDeclaration>(
    pb: PocketBase,
    queryClient: QueryClient
) {
    return <Config extends CollectionsConfig<Schema>>(
        config: Config
    ): ReactCollectionsResult<InferCollectionsMap<Schema, Config>> => {
        type CollectionsMap = InferCollectionsMap<Schema, Config>;

        const factory = new CollectionFactory<Schema>(pb, queryClient);

        const collections = Object.fromEntries(
            Object.entries(config).map(([key, opts]) => {
                const collectionName = opts._collectionName;
                const { _collectionName: _, collection: __, ...createOpts } = opts;
                const collection = factory.create(collectionName, createOpts);
                return [key, collection];
            })
        ) as CollectionsMap;

        const Context = createContext<CollectionsMap | null>(null);

        const Provider: React.FC<{ children: ReactNode }> = ({ children }) => (
            <Context.Provider value={collections}>{children}</Context.Provider>
        );

        function useStore<K extends keyof CollectionsMap>(key: K): CollectionsMap[K];
        function useStore<K extends readonly (keyof CollectionsMap)[]>(
            ...keys: K
        ): { [I in keyof K]: K[I] extends keyof CollectionsMap ? CollectionsMap[K[I]] : never };
        function useStore<K extends keyof CollectionsMap>(
            ...keys: K[]
        ): CollectionsMap[K] | CollectionsMap[K][] {
            const context = useContext(Context);

            if (!context) {
                throw new Error('useStore must be used within the Provider returned by createReactCollections');
            }

            if (keys.length === 1) {
                const key = keys[0];
                if (!(key in context)) {
                    throw new Error(`Collection "${String(key)}" not found in collections config`);
                }
                return context[key];
            }

            return keys.map((key) => {
                if (!(key in context)) {
                    throw new Error(`Collection "${String(key)}" not found in collections config`);
                }
                return context[key];
            }) as CollectionsMap[K][];
        }

        return {
            Provider,
            useStore: useStore as UseStoreFn<CollectionsMap>,
        };
    };
}
