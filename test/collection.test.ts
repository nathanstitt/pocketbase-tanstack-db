import { QueryClient } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLiveQuery } from '@tanstack/react-db'
import { eq } from '@tanstack/db'
import 'dotenv/config'


import PocketBase from 'pocketbase'
import { CollectionFactory } from '../src/collection'

import { Schema } from './schema'
const pb = new PocketBase(process.env.TESTING_PB_ADDR!)

describe('PBCollection - Real PocketBase Integration', () => {
    let queryClient: QueryClient
    let testJobSlug: string | null = null

    beforeAll(async () => {
        await pb.collection('users').authWithPassword( process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PW!)

        // Fetch a test job to use for queries
        try {
            const jobs = await pb.collection('jobs').getList(1, 1, {
                sort: '-created',
            })
            if (jobs.items.length > 0) {
                testJobSlug = jobs.items[0].slug
            }
        } catch (_error) {}
    })

    afterAll(() => {
        // Clear auth
        pb.authStore.clear()
    })

    beforeEach(() => {
        // Create a fresh query client for each test
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                    gcTime: Infinity, // Don't garbage collect queries during tests
                },
            },
        })
    })

    afterEach(() => {
        // Clear all queries
        queryClient.clear()
    })

    it('should fetch jobs with simple filter using pocketbase api', async () => {
        const result = await pb.collection('jobs').getList(1, 1)
        expect(result).toBeDefined()
        expect(Array.isArray(result.items)).toBe(true)
        expect(result.items.length).toBeGreaterThanOrEqual(1)

    }, 10000)

    it('should fetch job by slug using tanstack db collection', async () => {

        const collections = new CollectionFactory<Schema>(pb, queryClient)

        // is a tanstack DB collection

        const { result } = renderHook(
            () =>{
                const jobsCollection = collections.create('jobs')

                return useLiveQuery((q) =>
                    q.from({ jobs: jobsCollection })

                )
            }
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
        const job = result.current.data[0]
        console.log(result.current.data)
        const jobName: string = job.name
        expect(jobName).toBeTypeOf('string')


    })
})
