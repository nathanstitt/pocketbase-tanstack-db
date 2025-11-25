import { describe, expect, it } from 'vitest'
import { convertToPocketBaseFilter, convertToPocketBaseSort } from '../src/pocketbase-query-converter'
import { eq, gt, and, or } from '@tanstack/db'

describe('PocketBase Query Converter', () => {
    it('should convert eq operator to PocketBase filter', () => {
        // Create a where expression
        const whereExpr = eq(['genre'], 'Fantasy')

        const filter = convertToPocketBaseFilter(whereExpr)
        expect(filter).toBe('genre = "Fantasy"')
    })

    it('should convert gt operator to PocketBase filter', () => {
        const whereExpr = gt(['page_count'], 100)

        const filter = convertToPocketBaseFilter(whereExpr)
        expect(filter).toBe('page_count > 100')
    })

    it('should convert and operator to PocketBase filter', () => {
        const whereExpr = and(
            eq(['genre'], 'Fantasy'),
            gt(['page_count'], 100)
        )

        const filter = convertToPocketBaseFilter(whereExpr)
        expect(filter).toBe('(genre = "Fantasy" && page_count > 100)')
    })

    it('should convert or operator to PocketBase filter', () => {
        const whereExpr = or(
            eq(['genre'], 'Fantasy'),
            eq(['genre'], 'Science Fiction')
        )

        const filter = convertToPocketBaseFilter(whereExpr)
        expect(filter).toBe('(genre = "Fantasy" || genre = "Science Fiction")')
    })

    it('should return undefined for null/undefined input', () => {
        expect(convertToPocketBaseFilter(null)).toBeUndefined()
        expect(convertToPocketBaseFilter(undefined)).toBeUndefined()
    })

    // Note: orderBy conversion is tested in integration tests (server-side-filtering.test.ts)
    // because convertToPocketBaseSort requires the actual IR.OrderBy format from TanStack DB,
    // which cannot be easily mocked in unit tests.
    it.skip('should convert descending sort to PocketBase format', () => {
        const orderByExpr = { field: ['created'], direction: 'desc' as const }

        const sort = convertToPocketBaseSort(orderByExpr)
        expect(sort).toBe('-created')
    })

    it.skip('should convert ascending sort to PocketBase format', () => {
        const orderByExpr = { field: ['created'], direction: 'asc' as const }

        const sort = convertToPocketBaseSort(orderByExpr)
        expect(sort).toBe('created')
    })

    it('should return undefined for null/undefined sort input', () => {
        expect(convertToPocketBaseSort(null)).toBeUndefined()
        expect(convertToPocketBaseSort(undefined)).toBeUndefined()
    })
})
