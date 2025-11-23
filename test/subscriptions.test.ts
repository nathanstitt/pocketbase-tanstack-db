import { renderHook, waitFor } from '@testing-library/react'
import { useLiveQuery } from '@tanstack/react-db'
import { eq } from '@tanstack/db'
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it } from 'vitest'

import type { QueryClient } from '@tanstack/react-query'

import { pb, createTestQueryClient, authenticateTestUser, clearAuth, getTestSlug, createBooksCollection, createCollectionFactory, getTestAuthorId } from './helpers'

describe('Collection - Real-time Subscriptions', () => {

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

    it('should automatically subscribe to collection on creation', async () => {
        const booksCollection = createBooksCollection(queryClient)

        // Check that collection is subscribed (synchronously tracked)
        expect(booksCollection.isSubscribed()).toBe(true)
    })

    it('should receive real-time create events', async () => {
        const booksCollection = createBooksCollection(queryClient)

        // Set up the live query first
        const { result } = renderHook(() =>
            useLiveQuery((q) =>
                q.from({ books: booksCollection })
            )
        )

        // Wait for initial data load
        await waitFor(
            () => {
                expect(result.current.isLoading).toBe(false)
            },
            { timeout: 5000 }
        )

        const initialCount = result.current.data.length

        // Wait for subscription to be fully established
        // The auto-subscription is set up asynchronously in the background
        await booksCollection.waitForSubscription()

        // Create a new book via PocketBase
        const authorId = await getTestAuthorId()
        const newBook = await pb.collection('books').create({
            title: `Test Book ${Date.now().toString().slice(-8)}`,
            genre: 'Fiction',
            isbn: getTestSlug('test'),
            author: authorId
        })

        // Wait for the real-time update to propagate
        await waitFor(
            () => {
                expect(result.current.data.length).toBe(initialCount + 1)
            },
            { timeout: 5000 }
        )

        // Verify the new book appears in the collection
        const createdBook = result.current.data.find(b => b.id === newBook.id)
        expect(createdBook).toBeDefined()
        expect(createdBook?.title).toBe(newBook.title)

        // Cleanup: delete the test book (may fail if user doesn't have delete permission)
        try {
            await pb.collection('books').delete(newBook.id)
        } catch (_error) {
            // Ignore cleanup errors
        }
    }, 15000)

    it('should receive real-time update events', async () => {
        const booksCollection = createBooksCollection(queryClient)

        // Create a test book
        const authorId = await getTestAuthorId()
        const testBook = await pb.collection('books').create({
            title: `Update Test ${Date.now().toString().slice(-8)}`,
            genre: 'Fiction',
            isbn: getTestSlug('upd'),
            author: authorId
        })

        // Set up the live query
        const { result } = renderHook(() =>
            useLiveQuery((q) =>
                q.from({ books: booksCollection })
                    .where(({ books }) => eq(books.id, testBook.id))
            )
        )

        // Wait for initial data
        await waitFor(
            () => {
                expect(result.current.isLoading).toBe(false)
                expect(result.current.data.length).toBeGreaterThan(0)
            },
            { timeout: 5000 }
        )

        // Wait for subscription to be fully established
        await booksCollection.waitForSubscription()

        const originalTitle = result.current.data[0].title

        // Update the book
        const updatedTitle = `Updated ${Date.now().toString().slice(-8)}`
        await pb.collection('books').update(testBook.id, {
            title: updatedTitle
        })

        // Wait for the real-time update to propagate
        await waitFor(
            () => {
                const book = result.current.data[0]
                return book?.title === updatedTitle
            },
            { timeout: 5000 }
        )

        expect(result.current.data[0].title).toBe(updatedTitle)
        expect(result.current.data[0].title).not.toBe(originalTitle)

        // Cleanup
        try {
            await pb.collection('books').delete(testBook.id)
        } catch (_error) {
            // Ignore cleanup errors
        }
    }, 15000)

    it('should receive real-time delete events', async () => {
        const booksCollection = createBooksCollection(queryClient)

        // Create a test book
        const authorId = await getTestAuthorId()
        const testBook = await pb.collection('books').create({
            title: `Delete Test ${Date.now().toString().slice(-8)}`,
            genre: 'Fiction',
            isbn: getTestSlug('del'),
            author: authorId
        })

        // Set up the live query
        const { result } = renderHook(() =>
            useLiveQuery((q) =>
                q.from({ books: booksCollection })
            )
        )

        // Wait for initial data including our test book
        await waitFor(
            () => {
                expect(result.current.isLoading).toBe(false)
                const hasBook = result.current.data.some(b => b.id === testBook.id)
                return hasBook
            },
            { timeout: 5000 }
        )

        const countWithBook = result.current.data.length

        // Delete the book
        await pb.collection('books').delete(testBook.id)

        // Wait for the real-time delete to propagate
        await waitFor(
            () => {
                const stillHasBook = result.current.data.some(b => b.id === testBook.id)
                return !stillHasBook
            },
            { timeout: 5000 }
        )

        // Verify the book is gone
        expect(result.current.data.some(b => b.id === testBook.id)).toBe(false)
        expect(result.current.data.length).toBe(countWithBook - 1)
    }, 15000)

    it('should support subscribing to specific records', async () => {
        const booksCollection = createBooksCollection(queryClient)

        // Create a test book
        const authorId = await getTestAuthorId()
        const testBook = await pb.collection('books').create({
            title: `Specific ${Date.now().toString().slice(-8)}`,
            genre: 'Fiction',
            isbn: getTestSlug('spc'),
            author: authorId
        })

        // Subscribe to specific record
        await booksCollection.subscribe(testBook.id)

        // Check subscription status
        expect(booksCollection.isSubscribed(testBook.id)).toBe(true)

        // Set up live query
        const { result } = renderHook(() =>
            useLiveQuery((q) =>
                q.from({ books: booksCollection })
                    .where(({ books }) => eq(books.id, testBook.id))
            )
        )

        await waitFor(
            () => {
                expect(result.current.isLoading).toBe(false)
            },
            { timeout: 5000 }
        )

        // Update the specific record
        const updatedTitle = `Updated ${Date.now().toString().slice(-8)}`
        await pb.collection('books').update(testBook.id, {
            title: updatedTitle
        })

        // Wait for update
        await waitFor(
            () => {
                return result.current.data[0]?.title === updatedTitle
            },
            { timeout: 5000 }
        )

        expect(result.current.data[0].title).toBe(updatedTitle)

        // Cleanup
        booksCollection.unsubscribe(testBook.id)
        try {
            await pb.collection('books').delete(testBook.id)
        } catch (_error) {
            // Ignore cleanup errors
        }
    }, 15000)

    it('should support unsubscribe functionality', async () => {
        const booksCollection = createBooksCollection(queryClient)

        // Initially subscribed
        expect(booksCollection.isSubscribed()).toBe(true)

        // Unsubscribe from collection-wide
        booksCollection.unsubscribe()

        // Check it's unsubscribed
        expect(booksCollection.isSubscribed()).toBe(false)

        // Re-subscribe
        await booksCollection.subscribe()
        expect(booksCollection.isSubscribed()).toBe(true)

        // Cleanup
        booksCollection.unsubscribeAll()
    })

    it('should unsubscribe from all subscriptions', async () => {
        const booksCollection = createBooksCollection(queryClient)

        // Create test books
        const authorId = await getTestAuthorId()
        const book1 = await pb.collection('books').create({
            title: `Unsub1 ${Date.now().toString().slice(-8)}`,
            genre: 'Fiction',
            isbn: getTestSlug('un1'),
            author: authorId
        })

        await new Promise(resolve => setTimeout(resolve, 100)) // Ensure different timestamp
        const book2 = await pb.collection('books').create({
            title: `Unsub2 ${Date.now().toString().slice(-8)}`,
            genre: 'Fiction',
            isbn: getTestSlug('un2'),
            author: authorId
        })

        // Subscribe to specific records
        await booksCollection.subscribe(book1.id)
        await booksCollection.subscribe(book2.id)

        expect(booksCollection.isSubscribed()).toBe(true) // collection-wide
        expect(booksCollection.isSubscribed(book1.id)).toBe(true)
        expect(booksCollection.isSubscribed(book2.id)).toBe(true)

        // Unsubscribe from all
        booksCollection.unsubscribeAll()

        expect(booksCollection.isSubscribed()).toBe(false)
        expect(booksCollection.isSubscribed(book1.id)).toBe(false)
        expect(booksCollection.isSubscribed(book2.id)).toBe(false)

        // Cleanup
        try {
            await pb.collection('books').delete(book1.id)
        } catch (_error) {
            // Ignore cleanup errors
        }
        try {
            await pb.collection('books').delete(book2.id)
        } catch (_error) {
            // Ignore cleanup errors
        }
    }, 15000)

    it('should handle multiple simultaneous updates with writeBatch', async () => {
        const booksCollection = createBooksCollection(queryClient)

        // Set up live query
        const { result } = renderHook(() =>
            useLiveQuery((q) =>
                q.from({ books: booksCollection })
            )
        )

        await waitFor(
            () => {
                expect(result.current.isLoading).toBe(false)
            },
            { timeout: 5000 }
        )

        // Wait for subscription to be ready
        await booksCollection.waitForSubscription()

        const initialCount = result.current.data.length

        // Create multiple books rapidly (sequentially to avoid AbortError)
        const baseTimestamp = Date.now().toString().slice(-8)
        const books = []
        const authorId = await getTestAuthorId()

        // Create books one by one with minimal delay
        books.push(await pb.collection('books').create({
            title: `Batch1 ${baseTimestamp}`,
            genre: 'Fiction',
            isbn: `bt1-${baseTimestamp}`,
            author: authorId
        }))

        books.push(await pb.collection('books').create({
            title: `Batch2 ${baseTimestamp}`,
            genre: 'Fiction',
            isbn: `bt2-${baseTimestamp}`,
            author: authorId
        }))

        books.push(await pb.collection('books').create({
            title: `Batch3 ${baseTimestamp}`,
            genre: 'Fiction',
            isbn: `bt3-${baseTimestamp}`,
            author: authorId
        }))

        // Wait for all updates to propagate
        await waitFor(
            () => {
                return result.current.data.length >= initialCount + 3
            },
            { timeout: 10000 }
        )

        // Verify all books are present
        for (const book of books) {
            const foundBook = result.current.data.find(b => b.id === book.id)
            expect(foundBook).toBeDefined()
        }

        // Cleanup
        await Promise.all(books.map(async book => {
            try {
                await pb.collection('books').delete(book.id)
            } catch (_error) {
                // Ignore cleanup errors
            }
        }))
    }, 20000)

    it('should not create duplicate subscriptions', async () => {
        const booksCollection = createBooksCollection(queryClient)

        // Already subscribed automatically
        expect(booksCollection.isSubscribed()).toBe(true)

        // Try to subscribe again
        await booksCollection.subscribe()

        // Should still be subscribed (not errored)
        expect(booksCollection.isSubscribed()).toBe(true)

        // Cleanup
        booksCollection.unsubscribeAll()
    })

    it('should allow opting out of automatic subscriptions', async () => {
        const factory = createCollectionFactory(queryClient)
        const booksCollection = factory.create('books', {
            enableSubscriptions: false
        })

        // Should NOT be subscribed automatically
        expect(booksCollection.isSubscribed()).toBe(false)

        // Manually subscribe
        await booksCollection.subscribe()

        // Now should be subscribed
        expect(booksCollection.isSubscribed()).toBe(true)

        // Cleanup
        booksCollection.unsubscribeAll()
    })

    it('should support conditional subscriptions with opt-out', async () => {
        const factory = createCollectionFactory(queryClient)

        // Create collection without auto-subscription
        const booksCollection = factory.create('books', {
            enableSubscriptions: false
        })

        expect(booksCollection.isSubscribed()).toBe(false)

        // Set up live query
        const { result } = renderHook(() =>
            useLiveQuery((q) =>
                q.from({ books: booksCollection })
            )
        )

        await waitFor(
            () => {
                expect(result.current.isLoading).toBe(false)
            },
            { timeout: 5000 }
        )

        const initialCount = result.current.data.length

        // Create a new book
        const authorId = await getTestAuthorId()
        const newBook = await pb.collection('books').create({
            title: `Opt-out Test ${Date.now().toString().slice(-8)}`,
            genre: 'Fiction',
            isbn: getTestSlug('opt'),
            author: authorId
        })

        // Wait a bit to ensure no real-time update happens
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Data should NOT have updated via real-time (no subscription active)
        // The new book should not appear in the live query yet
        expect(result.current.data.some(b => b.id === newBook.id)).toBe(false)

        // Now manually subscribe
        await booksCollection.subscribe()

        // Create another book
        const newBook2 = await pb.collection('books').create({
            title: `Opt-out Test 2 ${Date.now().toString().slice(-8)}`,
            genre: 'Fiction',
            isbn: getTestSlug('opt2'),
            author: authorId
        })

        // Now the update should propagate
        await waitFor(
            () => {
                const hasNewBook = result.current.data.some(b => b.id === newBook2.id)
                return hasNewBook
            },
            { timeout: 5000 }
        )

        expect(result.current.data.some(b => b.id === newBook2.id)).toBe(true)

        // Cleanup
        try {
            await pb.collection('books').delete(newBook.id)
        } catch (_error) {
            // Ignore cleanup errors
        }
        try {
            await pb.collection('books').delete(newBook2.id)
        } catch (_error) {
            // Ignore cleanup errors
        }
        booksCollection.unsubscribeAll()
    }, 15000)
})
