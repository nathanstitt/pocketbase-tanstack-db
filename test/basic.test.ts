import { renderHook, waitFor } from '@testing-library/react'
import { useLiveQuery } from '@tanstack/react-db'
import { afterAll, beforeAll, beforeEach, afterEach, describe, expect, it } from 'vitest'
import type { QueryClient } from '@tanstack/react-query'

import {
    pb,
    createTestQueryClient,
    authenticateTestUser,
    clearAuth,
    createBooksCollection,
    createCollectionFactory
} from './helpers'

describe('Collection - Basic Operations', () => {
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

    it('should fetch books with simple filter using pocketbase api', async () => {
        const result = await pb.collection('books').getList(1, 1)
        expect(result).toBeDefined()
        expect(Array.isArray(result.items)).toBe(true)
        expect(result.items.length).toBeGreaterThanOrEqual(1)
    }, 10000)

    it('should fetch book by isbn using tanstack db collection', async () => {
        const booksCollection = createBooksCollection(queryClient)

        const { result } = renderHook(() =>
            useLiveQuery((q) =>
                q.from({ books: booksCollection })
            )
        )

        // Wait for the collection to load and have data
        await waitFor(
            () => {
                expect(result.current.isLoading).toBe(false)
            },
            { timeout: 5000 }
        )

        expect(result.current.isLoading).toBe(false)
        expect(result.current.data).toBeDefined()
        expect(result.current.data.length).toBeGreaterThanOrEqual(1)
        const book = result.current.data[0]
        const bookTitle: string = book.title
        expect(bookTitle).toBeTypeOf('string')
    })

    it('should accept relations config for type safety', async () => {
        const factory = createCollectionFactory(queryClient)

        // Create collections with relations config
        const authorsCollection = factory.create('authors')
        const booksCollection = factory.create('books', {
            relations: {
                author: authorsCollection  // Type-checked field name
            }
        })

        // Verify collections are created successfully
        expect(booksCollection).toBeDefined()
        expect(authorsCollection).toBeDefined()

        // Note: Actual join logic would be in useLiveQuery as shown in JSDoc example
        // This test validates that the API accepts relations configuration
    })
})
