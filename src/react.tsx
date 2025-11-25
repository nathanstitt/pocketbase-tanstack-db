import React, { createContext, useContext, type ReactNode } from 'react';

/**
 * UseStore hook type for variadic collection access.
 * @internal
 */
type UseStoreFn<CollectionsMap> = <K extends (keyof CollectionsMap)[]>(
    ...keys: K
) => { [I in keyof K]: K[I] extends keyof CollectionsMap ? CollectionsMap[K[I]] : never };

/**
 * Return type for createReactProvider function.
 */
export interface ReactProviderResult<CollectionsMap> {
    /**
     * React Context Provider component.
     * Wrap your app with this provider to make collections available to useStore.
     */
    Provider: React.FC<{ children: ReactNode }>;

    /**
     * Hook to access collections from the provider.
     * Uses variadic arguments for clean syntax with automatic type inference.
     *
     * @example
     * ```tsx
     * // Single collection
     * const [books] = useStore('books');
     *
     * // Multiple collections (no 'as const' needed!)
     * const [books, authors] = useStore('books', 'authors');
     * ```
     */
    useStore: UseStoreFn<CollectionsMap>;
}

/**
 * Creates a React Provider and useStore hook from an existing collections map.
 * This function wraps collections created by createCollections() for React integration.
 *
 * @param collections - Map of collection keys to Collection instances (from createCollections)
 * @returns Object containing Provider component and useStore hook
 *
 * @example
 * Basic usage:
 * ```tsx
 * import { createCollections, createReactProvider } from 'pbtsdb';
 * import { useLiveQuery } from '@tanstack/react-db';
 *
 * // Step 1: Create collections (universal)
 * const collections = createCollections<Schema>(pb, queryClient)({
 *     books: {},
 *     authors: {}
 * });
 *
 * // Step 2: Wrap for React
 * const { Provider, useStore } = createReactProvider(collections);
 *
 * // Step 3: Wrap your app
 * function App() {
 *     return (
 *         <QueryClientProvider client={queryClient}>
 *             <Provider>
 *                 <BooksList />
 *             </Provider>
 *         </QueryClientProvider>
 *     );
 * }
 *
 * // Step 4: Use in components
 * function BooksList() {
 *     const [books] = useStore('books');
 *     const { data } = useLiveQuery((q) => q.from({ books }));
 *     return <div>{data?.map(book => <p key={book.id}>{book.title}</p>)}</div>;
 * }
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
 *
 * @example
 * With expandable collections:
 * ```tsx
 * const collections = createCollections<Schema>(pb, queryClient)({
 *     authors: {},
 *     books: {
 *         expandable: {
 *             author: authorsCollection  // Pre-create authors first
 *         }
 *     }
 * });
 *
 * const { Provider, useStore } = createReactProvider(collections);
 *
 * function BooksWithExpandedAuthors() {
 *     const [books] = useStore('books');
 *     const booksWithAuthor = books.expand('author');
 *
 *     const { data } = useLiveQuery((q) => q.from({ books: booksWithAuthor }));
 *
 *     return (
 *         <ul>
 *             {data?.map(book => (
 *                 <li key={book.id}>
 *                     {book.title} by {book.expand?.author?.name}
 *                 </li>
 *             ))}
 *         </ul>
 *     );
 * }
 * ```
 */
export function createReactProvider<CollectionsMap extends Record<string, any>>(
    collections: CollectionsMap
): ReactProviderResult<CollectionsMap> {
    const Context = createContext<CollectionsMap | null>(null);

    const Provider: React.FC<{ children: ReactNode }> = ({ children }) => (
        <Context.Provider value={collections}>{children}</Context.Provider>
    );

    function useStore<K extends (keyof CollectionsMap)[]>(
        ...keys: K
    ): { [I in keyof K]: K[I] extends keyof CollectionsMap ? CollectionsMap[K[I]] : never } {
        const context = useContext(Context);

        if (!context) {
            throw new Error('useStore must be used within the Provider returned by createReactProvider');
        }

        return keys.map((key) => {
            if (!(key in context)) {
                throw new Error(`Collection "${String(key)}" not found in collections`);
            }
            return context[key];
        }) as { [I in keyof K]: K[I] extends keyof CollectionsMap ? CollectionsMap[K[I]] : never };
    }

    return {
        Provider,
        useStore: useStore as UseStoreFn<CollectionsMap>,
    };
}
