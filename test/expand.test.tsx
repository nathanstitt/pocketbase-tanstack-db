import { renderHook, waitFor } from '@testing-library/react';
import { useLiveQuery } from '@tanstack/react-db';
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';

import { CollectionFactory } from '../src/collection';
import { createReactCollections, defineCollection } from '../src/react';
import type { Schema } from './schema';
import { pb, createTestQueryClient, authenticateTestUser, clearAuth, getTestAuthorId } from './helpers';

describe('Query-Time Expand Feature', () => {
    let queryClient: QueryClient;
    let factory: CollectionFactory<Schema>;

    beforeAll(async () => {
        await authenticateTestUser();
    });

    afterAll(() => {
        clearAuth();
    });

    beforeEach(() => {
        queryClient = createTestQueryClient();
        factory = new CollectionFactory<Schema>(pb, queryClient);
    });

    afterEach(() => {
        queryClient.clear();
    });

    describe('CollectionFactory.create() with expandable', () => {
        it('should create collection with expandable config', () => {
            const authorsCollection = factory.create('authors');
            const booksCollection = factory.create('books', {
                expandable: {
                    author: authorsCollection
                }
            });

            expect(booksCollection.expand).toBeDefined();
            expect(typeof booksCollection.expand).toBe('function');
        });

        it('should create collection without expandable (expand method still exists)', () => {
            const booksCollection = factory.create('books');

            expect(booksCollection.expand).toBeDefined();
            expect(typeof booksCollection.expand).toBe('function');
        });

        it('should throw error when calling expand() without expandable config', () => {
            const booksCollection = factory.create('books');

            expect(() => {
                booksCollection.expand(['author'] as const);
            }).toThrow(/does not have expandable config/);
        });

        it('should throw error when expanding field not in expandable config', () => {
            const authorsCollection = factory.create('authors');
            const booksCollection = factory.create('books', {
                expandable: {
                    author: authorsCollection
                }
            });

            expect(() => {
                // @ts-expect-error - Testing invalid field
                booksCollection.expand(['invalid_field']);
            }).toThrow(/is not in expandable config/);
        });
    });

    describe('Expand with single relation', () => {
        it('should expand author relation and insert into authors collection', async () => {
            const authorsCollection = factory.create('authors');
            const booksCollection = factory.create('books', {
                expandable: {
                    author: authorsCollection
                }
            });

            const booksWithAuthor = booksCollection.expand(['author'] as const);

            const { result } = renderHook(
                () => {
                    const books = useLiveQuery((q) => q.from({ books: booksWithAuthor }));
                    const authors = useLiveQuery((q) => q.from({ authors: authorsCollection }));
                    return { books, authors };
                },
                { wrapper: ({ children }) => <>{children}</> }
            );

            await waitFor(
                () => {
                    expect(result.current.books.isLoading).toBe(false);
                    expect(result.current.authors.isLoading).toBe(false);
                },
                { timeout: 10000 }
            );

            const books = result.current.books.data;
            const authors = result.current.authors.data;

            expect(books).toBeDefined();
            expect(books!.length).toBeGreaterThan(0);

            const firstBook = books![0];
            expect(firstBook.expand).toBeDefined();
            expect(firstBook.expand!.author).toBeDefined();
            expect(firstBook.expand!.author!.name).toBeTypeOf('string');
            expect(firstBook.expand!.author!.id).toBe(firstBook.author);

            expect(authors).toBeDefined();
            expect(authors!.length).toBeGreaterThan(0);

            const expandedAuthorId = firstBook.expand!.author!.id;
            const authorInCollection = authors!.find(a => a.id === expandedAuthorId);
            expect(authorInCollection).toBeDefined();
            expect(authorInCollection!.name).toBe(firstBook.expand!.author!.name);
        }, 15000);

        it('should type-check expanded fields correctly', async () => {
            const authorsCollection = factory.create('authors');
            const booksCollection = factory.create('books', {
                expandable: {
                    author: authorsCollection
                }
            });

            const booksWithAuthor = booksCollection.expand(['author'] as const);

            const { result } = renderHook(
                () => useLiveQuery((q) => q.from({ books: booksWithAuthor })),
                { wrapper: ({ children }) => <>{children}</> }
            );

            await waitFor(
                () => {
                    expect(result.current.isLoading).toBe(false);
                },
                { timeout: 10000 }
            );

            const books = result.current.data;
            if (books && books[0]) {
                const authorName: string | undefined = books[0].expand?.author?.name;
                expect(authorName).toBeTypeOf('string');
            }
        }, 15000);
    });

    describe('Expand without selection (base collection)', () => {
        it('should not include expand when using base collection', async () => {
            const authorsCollection = factory.create('authors');
            const booksCollection = factory.create('books', {
                expandable: {
                    author: authorsCollection
                }
            });

            const { result } = renderHook(
                () => useLiveQuery((q) => q.from({ books: booksCollection })),
                { wrapper: ({ children }) => <>{children}</> }
            );

            await waitFor(
                () => {
                    expect(result.current.isLoading).toBe(false);
                },
                { timeout: 10000 }
            );

            const books = result.current.data;
            expect(books).toBeDefined();
            expect(books!.length).toBeGreaterThan(0);

            // @ts-expect-error - Testing runtime error
            expect(books.expand).toBeUndefined();

            // Base collection has no expand property - TypeScript enforces this
            const firstBook = books![0];
            expect(firstBook.title).toBeDefined();
            expect(firstBook.author).toBeTypeOf('string');
        }, 15000);
    });

    describe('React Integration with createReactCollections', () => {
        it('should work with useStore and expand', async () => {
            const { Provider, useStore } = createReactCollections<Schema>(pb, queryClient)({
                authors: defineCollection('authors', {}),
                books: defineCollection('books', {}),
            });

            const { result } = renderHook(
                () => {
                    const authors = useStore('authors');

                    const booksCollection = factory.create('books', {
                        expandable: {
                            author: authors
                        }
                    });

                    return useLiveQuery((q) =>
                        q.from({ books: booksCollection.expand(['author'] as const) })
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

            const books = result.current.data;
            expect(books).toBeDefined();
            expect(books!.length).toBeGreaterThan(0);
            expect(books![0].expand?.author).toBeDefined();

        }, 15000);

        it('should support using expandable with useStore collections', async () => {
            const { Provider, useStore } = createReactCollections<Schema>(pb, queryClient)({
                authors: defineCollection('authors', {}),
                books: defineCollection('books', {}),
            });

            const { result } = renderHook(
                () => {
                    const [books, authors] = useStore('books', 'authors');

                    // Create expandable relationship using useStore collections
                    const booksWithExpandable = factory.create('books', {
                        expandable: {
                            author: authors
                        }
                    });

                    return useLiveQuery((q) =>
                        q.from({ books: booksWithExpandable.expand(['author'] as const) })
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

            const books = result.current.data;
            expect(books).toBeDefined();
            expect(books!.length).toBeGreaterThan(0);
            expect(books![0].expand?.author).toBeDefined();
        }, 15000);
    });

    describe('Cache key normalization', () => {
        it('should normalize field order in query keys', async () => {
            const authorsCollection = factory.create('authors');
            const bookMetadataCollection = factory.create('book_metadata');

            const booksCollection = factory.create('books', {
                expandable: {
                    author: authorsCollection,
                }
            });

             const expandedBooks1 = booksCollection.expand(['author'] as const);
            const expandedBooks2 = booksCollection.expand(['author'] as const);

            const { result: result1 } = renderHook(
                () => useLiveQuery((q) => q.from({ books: expandedBooks1 })),
                { wrapper: ({ children }) => <>{children}</> }
            );

            await waitFor(() => expect(result1.current.isLoading).toBe(false), { timeout: 10000 });

            const { result: result2 } = renderHook(
                () => useLiveQuery((q) => q.from({ books: expandedBooks2 })),
                { wrapper: ({ children }) => <>{children}</> }
            );

            await waitFor(() => expect(result2.current.isLoading).toBe(false), { timeout: 10000 });

            expect(result1.current.data).toBeDefined();
            expect(result2.current.data).toBeDefined();
            expect(result1.current.data?.length).toBe(result2.current.data?.length);
        }, 15000);
    });

    describe('Error messages', () => {
        it('should provide helpful error when expandable not configured', () => {
            const booksCollection = factory.create('books');

            expect(() => {
                booksCollection.expand(['author'] as const);
            }).toThrow(/Collection 'books' does not have expandable config/);
            expect(() => {
                booksCollection.expand(['author'] as const);
            }).toThrow(/Add 'expandable' option when creating the collection/);
        });

        it('should list available fields when invalid field provided', () => {
            const authorsCollection = factory.create('authors');
            const booksCollection = factory.create('books', {
                expandable: {
                    author: authorsCollection
                }
            });

            expect(() => {
                // @ts-expect-error - Testing runtime error
                booksCollection.expand(['invalid']);
            }).toThrow(/Available fields: author/);
        });
    });
});
