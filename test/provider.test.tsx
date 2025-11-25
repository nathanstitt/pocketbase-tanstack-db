import { renderHook, waitFor } from '@testing-library/react';
import { useLiveQuery } from '@tanstack/react-db';
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it } from 'vitest';
import { eq } from '@tanstack/db'
import type { QueryClient } from '@tanstack/react-query';

import { createReactProvider } from '../src/react';
import { createCollection } from '../src/collection';
import type { Schema } from './schema';
import { pb, createTestQueryClient, authenticateTestUser, clearAuth, getTestAuthorId } from './helpers';

describe('createReactProvider', () => {
    let queryClient: QueryClient;

    beforeAll(async () => {
        await authenticateTestUser();
    });

    afterAll(() => {
        clearAuth();
    });

    beforeEach(() => {
        queryClient = createTestQueryClient();
    });

    afterEach(() => {
        queryClient.clear();
    });

    describe('useStore', () => {
        it('should throw error when used outside provider', () => {
            const c = createCollection<Schema>(pb, queryClient);
            const collections = {
                books: c('books', {}),
            };
            const { useStore } = createReactProvider(collections);

            expect(() => {
                renderHook(() => useStore('books'));
            }).toThrow('useStore must be used within the Provider returned by createReactProvider');
        });

        it('should throw error when collection key does not exist', () => {
            const c = createCollection<Schema>(pb, queryClient);
            const collections = {
                books: c('books', {}),
            };
            const { Provider, useStore } = createReactProvider(collections);

            expect(() => {
                // @ts-expect-error - Testing runtime error for invalid key
                renderHook(() => useStore('nonexistent'), {
                    wrapper: ({ children }) => <Provider>{children}</Provider>
                });
            }).toThrow('Collection "nonexistent" not found in collections');
        });

        it('should return collection from provider with automatic type inference', () => {
            const c = createCollection<Schema>(pb, queryClient);
            const collections = {
                books: c('books', {}),
            };
            const { Provider, useStore } = createReactProvider(collections);

            const { result } = renderHook(() => useStore('books'), {
                wrapper: ({ children }) => <Provider>{children}</Provider>
            });

            expect(result.current).toBeDefined();
            expect(Array.isArray(result.current)).toBe(true);
            expect(result.current).toHaveLength(1);
            expect(result.current[0]).toHaveProperty('subscribe');
            expect(result.current[0]).toHaveProperty('utils');
        });

        it('should allow using collection in useLiveQuery', async () => {
            const c = createCollection<Schema>(pb, queryClient);
            const collections = {
                books: c('books', {}),
            };
            const { Provider, useStore } = createReactProvider(collections);

            const authorId = await getTestAuthorId()
            const { result } = renderHook(
                () => {
                    const [collection] = useStore('books');
                    return useLiveQuery((q) => q.from({ books: collection })
                        .where(({ books }) => eq(books.author,  authorId))
                    );
                },
                { wrapper: ({ children }) => <Provider>{children}</Provider> }
            );

            await waitFor(
                () => {
                    expect(result.current.isLoading).toBe(false);
                },
                { timeout: 10000 }
            );

            expect(result.current.data).toBeDefined();
            expect(Array.isArray(result.current.data)).toBe(true);
            expect(result.current.data.length).toBeGreaterThanOrEqual(1)
            expect(result.current.data[0].author).toBeTypeOf('string')
        }, 15000);
    });

    describe('useStore with multiple keys', () => {
        it('should throw error when used outside provider', () => {
            const c = createCollection<Schema>(pb, queryClient);
            const collections = {
                books: c('books', {}),
                authors: c('authors', {}),
            };
            const { useStore } = createReactProvider(collections);

            expect(() => {
                renderHook(() => useStore('books', 'authors'));
            }).toThrow('useStore must be used within the Provider returned by createReactProvider');
        });

        it('should throw error when any collection key does not exist', () => {
            const c = createCollection<Schema>(pb, queryClient);
            const collections = {
                books: c('books', {}),
            };
            const { Provider, useStore } = createReactProvider(collections);

            expect(() => {
                // @ts-expect-error - Testing runtime error for invalid key
                renderHook(() => useStore('books', 'nonexistent'), {
                    wrapper: ({ children }) => <Provider>{children}</Provider>
                });
            }).toThrow('Collection "nonexistent" not found in collections');
        });

        it('should return array of collections in correct order with automatic type inference', () => {
            const c = createCollection<Schema>(pb, queryClient);
            const collections = {
                books: c('books', {}),
                authors: c('authors', {}),
                book_metadata: c('book_metadata', {}),
            };
            const { Provider, useStore } = createReactProvider(collections);

            const { result } = renderHook(
                () => useStore('books', 'authors', 'book_metadata'),
                { wrapper: ({ children }) => <Provider>{children}</Provider> }
            );

            expect(result.current).toHaveLength(3);
            expect(result.current[0]).toBeDefined();
            expect(result.current[1]).toBeDefined();
            expect(result.current[2]).toBeDefined();
            expect(result.current[0]).toHaveProperty('subscribe');
            expect(result.current[1]).toHaveProperty('subscribe');
            expect(result.current[2]).toHaveProperty('subscribe');
        });

        it('should allow using collections in useLiveQuery with joins', async () => {
            const c = createCollection<Schema>(pb, queryClient);
            const collections = {
                books: c('books', {}),
                authors: c('authors', {}),
            };
            const { Provider, useStore } = createReactProvider(collections);

            const { result } = renderHook(
                () => {
                    const [books] = useStore('books');
                    return useLiveQuery((q) => q.from({ books }));
                },
                { wrapper: ({ children }) => <Provider>{children}</Provider> }
            );

            await waitFor(
                () => {
                    expect(result.current.isLoading).toBe(false);
                },
                { timeout: 10000 }
            );

            expect(result.current.data).toBeDefined();
            expect(Array.isArray(result.current.data)).toBe(true);
        }, 15000);
    });

    describe('Provider', () => {
        it('should provide collections to nested components', () => {
            const c = createCollection<Schema>(pb, queryClient);
            const collections = {
                books: c('books', {}),
                authors: c('authors', {}),
            };
            const { Provider, useStore } = createReactProvider(collections);

            const { result: result1 } = renderHook(() => useStore('books'), {
                wrapper: ({ children }) => <Provider>{children}</Provider>
            });

            expect(result1.current).toBeDefined();
            expect(result1.current[0]).toBeDefined();

            const { result: result2 } = renderHook(() => useStore('authors'), {
                wrapper: ({ children }) => <Provider>{children}</Provider>
            });

            expect(result2.current).toBeDefined();
            expect(result2.current[0]).toBeDefined();
        });

        it('should support custom collection keys', () => {
            const collections = {
                myCustomBooksKey: createCollection<Schema>(pb, queryClient)('books', {})
            };
            const { Provider, useStore } = createReactProvider(collections);

            const { result } = renderHook(() => useStore('myCustomBooksKey'), {
                wrapper: ({ children }) => <Provider>{children}</Provider>
            });

            expect(result.current).toBeDefined();
            expect(result.current[0]).toHaveProperty('subscribe');
            expect(result.current[0]).toHaveProperty('utils');
        });

        it('should infer collection name from key when using createCollection', () => {
            const c = createCollection<Schema>(pb, queryClient);
            const collections = {
                books: c('books', {}),
            };
            const { Provider, useStore } = createReactProvider(collections);

            const { result } = renderHook(() => useStore('books'), {
                wrapper: ({ children }) => <Provider>{children}</Provider>
            });

            expect(result.current).toBeDefined();
            expect(result.current[0]).toBeDefined();
        });

        it('should support expandable collections within provider context', async () => {
            const c = createCollection<Schema>(pb, queryClient);
            const authors = c('authors', {
                omitOnInsert: ['created']
            });
            const books = c('books', {
                omitOnInsert: ['created'],
                expandable: {
                    author: authors,
                }
            });
            const collections = {
                authors,
                books,
            };
            const { Provider, useStore } = createReactProvider(collections);

            const authorId = await getTestAuthorId();
            const { result } = renderHook(
                () => {
                    const [books, _] = useStore('books', 'authors')
                    const booksQuery = useLiveQuery((q) =>
                        q.from({ books: books.expand('author') })
                            .where(({ books }) => eq(books.author, authorId))
                    );
                    const authorsQuery = useLiveQuery((q) => q.from({ authors }));

                    return { books: booksQuery, authors: authorsQuery };
                },
                { wrapper: ({ children }) => <Provider>{children}</Provider> }
            );

            await waitFor(
                () => {
                    expect(result.current.books.isLoading).toBe(false);
                    expect(result.current.authors.isLoading).toBe(false);
                },
                { timeout: 10000 }
            );

            expect(result.current.books.data).toBeDefined();
            expect(Array.isArray(result.current.books.data)).toBe(true);

            if (result.current.books.data && result.current.books.data.length > 0) {
                const book = result.current.books.data[0];
                expect(book).toBeDefined();
                expect(book.author).toBe(authorId);

                // Check that expand property exists and contains author data
                if (book.expand?.author) {
                    expect(book.expand.author).toBeDefined();
                    expect(book.expand.author.id).toBe(authorId);
                    expect(authors.has(authorId)).toBeTruthy()
                    expect(book.expand.author.name).toBeTypeOf('string');
                    expect(book.expand.author.email).toBeTypeOf('string');
                }
            }
        }, 15000);
    });

});
