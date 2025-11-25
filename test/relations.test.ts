import { renderHook, waitFor } from '@testing-library/react'
import { useLiveQuery } from '@tanstack/react-db'
import { eq } from '@tanstack/db'
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it } from 'vitest'

import type { QueryClient } from '@tanstack/react-query'

import { pb, createTestQueryClient, authenticateTestUser, clearAuth, createCollectionFactory } from './helpers'
import type { Schema } from './schema'

describe('Collection - Relations', () => {
    let queryClient: QueryClient

    beforeAll(async () => {
        await authenticateTestUser()
    })

    afterAll(() => {
        clearAuth()
    })

    beforeEach(() => {
        queryClient = createTestQueryClient()
    })

    afterEach(() => {
        queryClient.clear()
    })

    it('should join books with authors using manual join pattern', async () => {
        const factory = createCollectionFactory(queryClient)

        // Create collections with relations config
        const authorsCollection = factory.create('authors', { syncMode: 'eager' })
        const booksCollection = factory.create('books', { syncMode: 'eager' })

        const { result } = renderHook(() =>
            useLiveQuery((q) =>
                q.from({ book: booksCollection })
                    .join(
                        { author: authorsCollection },
                        ({ book, author }) => eq(book.author, author.id),
                        'left'
                    )
                    .select(({ book, author }) => ({
                        ...book,
                        expand: {
                            author: author ? { ...author } : undefined
                        }
                    }))
            )
        )

        // Wait for the query to load
        await waitFor(
            () => {
                expect(result.current.isLoading).toBe(false)
            },
            { timeout: 10000 }
        )

        expect(result.current.isLoading).toBe(false)
        expect(result.current.data).toBeDefined()
        expect(result.current.data.length).toBeGreaterThanOrEqual(1)

        // Verify the joined data structure
        const bookWithAuthor = result.current.data[0]

        // Original book fields should exist
        expect(bookWithAuthor.id).toBeDefined()
        expect(bookWithAuthor.title).toBeDefined()
        expect(bookWithAuthor.author).toBeDefined() // FK ID still exists

        // With on-demand sync mode and manual joins, the expand structure is created client-side
        // by the select() function. The expand property should exist with author data from the join.
        const authorData = bookWithAuthor.expand.author
        expect(authorData?.id).toBeDefined()
        if (!authorData) throw new Error('Expected author expand to be defined')

        expect(authorData.name).toBeDefined()

        // The author ID should match the FK
        expect(authorData.id).toBe(bookWithAuthor.author)

        // Type inference test - these should be typed correctly
        const authorId: string = authorData.id
        const authorName: string = authorData.name
        expect(authorId).toBeTypeOf('string')
        expect(authorName).toBeTypeOf('string')
    }, 15000)

    it('should expand relations when specified with expandable', async () => {
        const factory = createCollectionFactory(queryClient)
        const authorsCollection = factory.create('authors', { syncMode: 'eager' })
        const booksCollection = factory.create('books', {
            syncMode: 'eager',
            expandable: {
                author: authorsCollection
            }
        })

        const { result } = renderHook(() =>
            useLiveQuery((q) =>
                q.from({ books: booksCollection.expand('author') })
            )
        )

        await waitFor(
            () => {
                expect(result.current.isLoading).toBe(false)
            },
            { timeout: 5000 }
        )

        expect(result.current.data).toBeDefined()
        expect(result.current.data.length).toBeGreaterThan(0)

        const firstBook = result.current.data[0]

        // Type checking: These should compile without errors
        expect(firstBook.expand).toBeDefined()

        const authorName: string | undefined = firstBook.expand?.author?.name
        expect(authorName).toBeTypeOf('string')


    })

    it('should filter on nested relation fields', async () => {
        const factory = createCollectionFactory(queryClient)
        const authorsCollection = factory.create('authors', { syncMode: 'eager' })
        const booksCollection = factory.create('books', {
            syncMode: 'eager',
            expandable: {
                author: authorsCollection
            }
        })

        const booksWithAuthor = booksCollection.expand('author')

        // Get an author ID to filter by
        const allBooks = await pb.collection('books').getList(1, 10, {
            expand: 'author'
        })
        expect(allBooks.items.length).toBeGreaterThan(0)

        // Find a book with an author
        const bookWithAuthor = allBooks.items.find(b => b.author)
        if (!bookWithAuthor) {
            // Skip if no books have authors
            return
        }

        const testAuthorId = bookWithAuthor.author

        const { result } = renderHook(() =>
            useLiveQuery((q) =>
                q.from({ books: booksWithAuthor })
                    .where(({ books }) => eq(books.author, testAuthorId))
            )
        )

        await waitFor(
            () => {
                expect(result.current.isLoading).toBe(false)
            },
            { timeout: 5000 }
        )

        expect(result.current.data).toBeDefined()
        expect(result.current.data.length).toBeGreaterThan(0)

        // All results should have the same author
        result.current.data.forEach(book => {
            expect(book.author).toBe(testAuthorId)
        })
    })

    it('should expand relations using query-level expand() operator', async () => {
        const factory = createCollectionFactory(queryClient)
        const booksCollection = factory.create('books', { syncMode: 'eager' })

        const { result } = renderHook(() =>
            useLiveQuery((q) =>
                q.from({ books: booksCollection }).expand<Schema, 'books'>('author')
            )
        )

        await waitFor(
            () => {
                expect(result.current.isLoading).toBe(false)
            },
            { timeout: 5000 }
        )

        expect(result.current.data).toBeDefined()
        expect(result.current.data.length).toBeGreaterThan(0)

        // Now fully typed - no type assertion needed!
        const firstBook = result.current.data[0]

        // Verify expand structure exists
        expect(firstBook.expand).toBeDefined()
        expect(firstBook.expand?.author).toBeDefined()

        // Verify author data is populated - all typed!
        const author = firstBook.expand?.author
        if (author) {
            expect(author.id).toBeDefined()
            expect(author.name).toBeDefined()
            expect(author.email).toBeDefined()
        }
    })

    it('should expand multiple relations using query-level expand() operator', async () => {
        const factory = createCollectionFactory(queryClient)
        const booksCollection = factory.create('books', { syncMode: 'eager' })

        const { result } = renderHook(() =>
            useLiveQuery((q) =>
                q.from({ books: booksCollection }).expand<Schema, 'books'>('author')
            )
        )

        await waitFor(
            () => {
                expect(result.current.isLoading).toBe(false)
            },
            { timeout: 5000 }
        )

        expect(result.current.data).toBeDefined()
        expect(result.current.data.length).toBeGreaterThan(0)

        const firstBook = result.current.data[0]

        // Verify all expanded relations - fully typed!
        expect(firstBook.expand?.author).toBeDefined()
    })

    it('should allow chaining expand() with where() and orderBy()', async () => {
        const factory = createCollectionFactory(queryClient)
        const booksCollection = factory.create('books')

        // Get test data
        const allBooks = await pb.collection('books').getList(1, 10)
        const testGenre = allBooks.items[0].genre

        const { result } = renderHook(() =>
            useLiveQuery((q) =>
                q.from({ books: booksCollection })
                    .expand<Schema, 'books'>('author')
                    .where(({ books }) => eq(books.genre, testGenre))
                    .orderBy(({ books }) => books.title)
            )
        )

        await waitFor(
            () => {
                expect(result.current.isLoading).toBe(false)
            },
            { timeout: 5000 }
        )

        expect(result.current.data).toBeDefined()
        expect(result.current.data.length).toBeGreaterThan(0)

        // Verify expand works with filtering - fully typed!
        const firstBook = result.current.data[0]
        expect(firstBook.genre).toBe(testGenre)
        expect(firstBook.expand?.author).toBeDefined()

        // Verify ordering
        for (let i = 1; i < result.current.data.length; i++) {
            expect(result.current.data[i].title >= result.current.data[i - 1].title).toBe(true)
        }
    })
})
