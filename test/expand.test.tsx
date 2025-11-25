import { renderHook, waitFor } from '@testing-library/react';
import { eq, useLiveQuery } from '@tanstack/react-db';
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';

import { createCollection } from '../src/collection';
import { createReactProvider } from '../src/react';
import type { Schema } from './schema';
import { pb, createTestQueryClient, authenticateTestUser, clearAuth, getTestAuthorId, createAuthorsCollection } from './helpers';


describe('Query-Time Expand Feature', () => {
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

    describe('createCollection() with expandable', () => {
        it('should create collection with expandable config', () => {
            const authorsCollection = createCollection<Schema>(pb, queryClient)('authors', {});
            const booksCollection = createCollection<Schema>(pb, queryClient)('books', {
                expandable: {
                    author: authorsCollection
                }
            });

            expect(booksCollection.expand).toBeDefined();
            expect(typeof booksCollection.expand).toBe('function');
        });

        it('should create collection without expandable (expand method still exists)', () => {
            const booksCollection = createCollection<Schema>(pb, queryClient)('books', {});

            expect(booksCollection.expand).toBeDefined();
            expect(typeof booksCollection.expand).toBe('function');
        });

        it('should throw error when calling expand() without expandable config', () => {
            const booksCollection = createCollection<Schema>(pb, queryClient)('books', {});

            expect(() => {
                booksCollection.expand('author');
            }).toThrowError(/Field 'author' is not in expandable config/)
        });

        it('should throw error when expanding field not in expandable config', () => {
            const authorsCollection = createCollection<Schema>(pb, queryClient)('authors', {});
            const booksCollection = createCollection<Schema>(pb, queryClient)('books', {
                expandable: {
                    author: authorsCollection
                }
            });

            expect(() => {
                // @ts-expect-error - Testing invalid field
                booksCollection.expand('invalid_field');
            }).toThrow(/is not in expandable config/);
        });
    });

    describe('Expand with single relation', () => {
        it('should expand author relation with expand data', async () => {
            const authorsCollection = createCollection<Schema>(pb, queryClient)('authors', { syncMode: 'eager' })
            const booksCollection = createCollection<Schema>(pb, queryClient)('books', {
                syncMode: 'eager',
                expandable: {
                    author: authorsCollection,
                }
            });

            const { result } = renderHook(
                () => {
                    return useLiveQuery((q) => q.from({ books: booksCollection.expand('author') }))
                },
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
            if (!books) throw new Error('no books?')
            expect(books.length).toBeGreaterThan(0);

            const firstBook = books[0];
            expect(firstBook.expand).toBeDefined()
            if (!firstBook) throw new Error('no book')
            expect(firstBook.expand?.author).toBeDefined();
            const authors = Array.from(authorsCollection.entries())

            //expect(authors.length).toBe(1)

            expect(firstBook.expand!.author!.name).toBeTypeOf('string');
            expect(firstBook.expand!.author!.id).toBe(firstBook.author);
        }, 15000);

        it('should type-check expanded fields correctly', async () => {
            const authorsCollection = createCollection<Schema>(pb, queryClient)('authors', {});
            const booksCollection = createCollection<Schema>(pb, queryClient)('books', {
                expandable: {
                    author: authorsCollection
                }
            });

            const booksWithAuthor = booksCollection.expand('author');

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
            const authorsCollection = createCollection<Schema>(pb, queryClient)('authors', { syncMode: 'eager' });
            const booksCollection = createCollection<Schema>(pb, queryClient)('books', {
                syncMode: 'eager',
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

    describe('React Integration with createReactProvider', () => {
        it('should work with useStore and expand', async () => {

            const c = createCollection<Schema>(pb, queryClient);
            const authors = c('authors', { syncMode: 'eager' });
            const booksCollection = c('books', {
                syncMode: 'eager',
                expandable: {
                    author: authors,
                }
            });
            const collections = {
                authors,
                books: booksCollection,
            };

            const { Provider, useStore } = createReactProvider(collections);

            const { result } = renderHook(
                () => {
                    const [books] = useStore('books');

                    return useLiveQuery((q) =>
                        q.from({ books: books.expand('author') })
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
            const c = createCollection<Schema>(pb, queryClient);
            const collections = {
                authors: c('authors', { syncMode: 'eager' }),
                books: c('books', { syncMode: 'eager' }),
            };
            const { Provider, useStore } = createReactProvider(collections);

            const { result } = renderHook(
                () => {
                    const [books, authors] = useStore('books', 'authors');

                    const booksWithExpandable = createCollection<Schema>(pb, queryClient)('books', {
                        syncMode: 'eager',
                        expandable: {
                            author: authors
                        }
                    });

                    return useLiveQuery((q) =>
                        q.from({ books: booksWithExpandable.expand('author') })
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
            const authorsCollection = createCollection<Schema>(pb, queryClient)('authors', {});
            const bookMetadataCollection = createCollection<Schema>(pb, queryClient)('book_metadata', {});

            const booksCollection = createCollection<Schema>(pb, queryClient)('books', {
                expandable: {
                    author: authorsCollection,
                }
            });

            const expandedBooks1 = booksCollection.expand('author');
            const expandedBooks2 = booksCollection.expand('author');

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
        it('should list available fields when invalid field provided', () => {
            const authorsCollection = createCollection<Schema>(pb, queryClient)('authors', {});
            const booksCollection = createCollection<Schema>(pb, queryClient)('books', {
                expandable: {
                    author: authorsCollection
                }
            });

            expect(() => {
                // @ts-expect-error - Testing runtime error
                booksCollection.expand('invalid');
            }).toThrow(/Available fields: author/);
        });
    });

    describe('Query-level expand() operator', () => {
        it('should expand using query-level .expand() instead of collection.expand()', async () => {
            const booksCollection = createCollection<Schema>(pb, queryClient)('books', { syncMode: 'eager' });

            const { result } = renderHook(
                () => useLiveQuery((q) => q.from({ books: booksCollection }).expand<Schema, 'books'>('author')),
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
            if (!books) throw new Error('no books');
            expect(books.length).toBeGreaterThan(0);

            // Now fully typed - no type assertion needed!
            const firstBook = books[0]
            expect(firstBook.expand).toBeDefined();
            expect(firstBook.expand?.author).toBeDefined();
            expect(firstBook.expand!.author!.name).toBeTypeOf('string');
            expect(firstBook.expand!.author!.id).toBe(firstBook.author);
        }, 15000);

        it('should support chaining query-level expand with other operators', async () => {
            const booksCollection = createCollection<Schema>(pb, queryClient)('books', { syncMode: 'eager' });

            const { result } = renderHook(
                () => useLiveQuery((q) =>
                    q.from({ books: booksCollection })
                        .expand<Schema, 'books'>('author')
                        .orderBy(({ books }) => books.title)
                ),
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
            if (!books) throw new Error('no books');
            expect(books.length).toBeGreaterThan(0);

            // Fully typed!
            const firstBook = books[0]
            expect(firstBook.expand?.author).toBeDefined();

            // Verify ordering
            for (let i = 1; i < books.length; i++) {
                expect(books[i].title >= books[i - 1].title).toBe(true);
            }
        }, 15000);
    });
});
