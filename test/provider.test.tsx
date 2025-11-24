import { renderHook, waitFor } from '@testing-library/react';
import { useLiveQuery } from '@tanstack/react-db';
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it } from 'vitest';
import { eq } from '@tanstack/db'
import type { QueryClient } from '@tanstack/react-query';

import { createReactCollections, defineCollection } from '../src/react';
import { CollectionFactory } from '../src/collection';
import type { Schema } from './schema';
import { pb, createTestQueryClient, authenticateTestUser, clearAuth, getTestAuthorId } from './helpers';

describe('createReactCollections', () => {
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
            const { useStore } = createReactCollections<Schema>(pb, queryClient)({
                books: defineCollection('books', {}),
            });

            expect(() => {
                renderHook(() => useStore('books'));
            }).toThrow('useStore must be used within the Provider returned by createReactCollections');
        });

        it('should throw error when collection key does not exist', () => {
            const { Provider, useStore } = createReactCollections<Schema>(pb, queryClient)({
                books: defineCollection('books', {}),
            });

            expect(() => {
                // @ts-expect-error - Testing runtime error for invalid key
                renderHook(() => useStore('nonexistent'), {
                    wrapper: ({ children }) => <Provider>{children}</Provider>
                });
            }).toThrow('Collection "nonexistent" not found in collections config');
        });

        it('should return collection from provider with automatic type inference', () => {
            const { Provider, useStore } = createReactCollections<Schema>(pb, queryClient)({
                books: defineCollection('books', {}),
            });

            const { result } = renderHook(() => useStore('books'), {
                wrapper: ({ children }) => <Provider>{children}</Provider>
            });

            expect(result.current).toBeDefined();
            expect(result.current).toHaveProperty('subscribe');
            expect(result.current).toHaveProperty('utils');
        });

        it('should allow using collection in useLiveQuery', async () => {
            const { Provider, useStore } = createReactCollections<Schema>(pb, queryClient)({
                books: defineCollection('books', {}),
            });

            const authorId = await getTestAuthorId()
            const { result } = renderHook(
                () => {
                    const collection = useStore('books');
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
            const { useStore } = createReactCollections<Schema>(pb, queryClient)({
                books: defineCollection('books', {}),
                authors: defineCollection('authors', {}),
            });

            expect(() => {
                renderHook(() => useStore('books', 'authors'));
            }).toThrow('useStore must be used within the Provider returned by createReactCollections');
        });

        it('should throw error when any collection key does not exist', () => {
            const { Provider, useStore } = createReactCollections<Schema>(pb, queryClient)({
                books: defineCollection('books', {}),
            });

            expect(() => {
                // @ts-expect-error - Testing runtime error for invalid key
                renderHook(() => useStore('books', 'nonexistent'), {
                    wrapper: ({ children }) => <Provider>{children}</Provider>
                });
            }).toThrow('Collection "nonexistent" not found in collections config');
        });

        it('should return array of collections in correct order with automatic type inference', () => {
            const { Provider, useStore } = createReactCollections<Schema>(pb, queryClient)({
                books: defineCollection('books', {}),
                authors: defineCollection('authors', {}),
                metadata: defineCollection('book_metadata', {}),
            });

            const { result } = renderHook(
                () => useStore('books', 'authors', 'metadata'),
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
            const { Provider, useStore } = createReactCollections<Schema>(pb, queryClient)({
                books: defineCollection('books', {}),
                authors: defineCollection('authors', {}),
            });

            const { result } = renderHook(
                () => {
                    const books = useStore('books');
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
            const { Provider, useStore } = createReactCollections<Schema>(pb, queryClient)({
                books: defineCollection('books', {}),
                authors: defineCollection('authors', {}),
            });

            const { result: result1 } = renderHook(() => useStore('books'), {
                wrapper: ({ children }) => <Provider>{children}</Provider>
            });

            expect(result1.current).toBeDefined();

            const { result: result2 } = renderHook(() => useStore('authors'), {
                wrapper: ({ children }) => <Provider>{children}</Provider>
            });

            expect(result2.current).toBeDefined();
        });

        it('should support custom collection keys with override', () => {
            const { Provider, useStore } = createReactCollections<Schema>(pb, queryClient)({
                myCustomBooksKey: defineCollection('books', {}),
            });

            const { result } = renderHook(() => useStore('myCustomBooksKey'), {
                wrapper: ({ children }) => <Provider>{children}</Provider>
            });

            expect(result.current).toBeDefined();
            expect(result.current).toHaveProperty('subscribe');
            expect(result.current).toHaveProperty('utils');
        });

        it('should infer collection name from key when not specified', () => {
            const { Provider, useStore } = createReactCollections<Schema>(pb, queryClient)({
                books: defineCollection('books', {}),
            });

            const { result } = renderHook(() => useStore('books'), {
                wrapper: ({ children }) => <Provider>{children}</Provider>
            });

            expect(result.current).toBeDefined();
        });

        it('should support expandable collections within provider context', async () => {
            // Create a factory to set up collections with expandable
            const factory = new CollectionFactory<Schema>(pb, queryClient);
            const authorsCollection = factory.create('authors');
            const booksCollection = factory.create('books', {
                expandable: {
                    author: authorsCollection
                },
            });

            const { Provider, useStore } = createReactCollections<Schema>(pb, queryClient)({
                authors: defineCollection('authors', {}),
                books: defineCollection('books', {}),
            });

            const authorId = await getTestAuthorId();
            const { result } = renderHook(
                () => {
                    // Use the expandable collection with expand
                    const expandedBooks = booksCollection.expand(['author'] as const);

                    return useLiveQuery((q) =>
                        q.from({ books: expandedBooks })
                            .where(({ books }) => eq(books.author, authorId))
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

            if (result.current.data && result.current.data.length > 0) {
                const book = result.current.data[0];
                expect(book).toBeDefined();
                expect(book.author).toBe(authorId);

                // Check that expand property exists and contains author data
                if (book.expand?.author) {
                    expect(book.expand.author).toBeDefined();
                    expect(book.expand.author.id).toBe(authorId);
                    expect(book.expand.author.name).toBeTypeOf('string');
                    expect(book.expand.author.email).toBeTypeOf('string');
                }
            }
        }, 15000);
    });

});
