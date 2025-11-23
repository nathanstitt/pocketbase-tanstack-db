import React, { createContext, useContext, type ReactNode } from 'react';
import type { Collection } from '@tanstack/db';
import type { SchemaDeclaration } from './types';

/**
 * Map of collection names to TanStack DB Collection instances.
 * Keys are user-defined strings, values are Collection instances.
 *
 * @example
 * ```ts
 * const stores = {
 *     jobs: jobsCollection,
 *     customers: customersCollection,
 *     addresses: addressesCollection
 * };
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CollectionsMap = Record<string, Collection<any>>;

/**
 * Context for providing collections to React components.
 * @internal
 */
const CollectionsContext = createContext<CollectionsMap | null>(null);

/**
 * Props for the CollectionsProvider component.
 */
export interface CollectionsProviderProps {
    /** Map of collection name to Collection instance */
    collections: CollectionsMap;
    /** React children to render */
    children: ReactNode;
}

/**
 * Provider component that makes collections available to all child components.
 * Wrap your app with this provider to use the useStore and useStores hooks.
 *
 * @example
 * ```tsx
 * const factory = new CollectionFactory<Schema>(pb, queryClient);
 * const collections = {
 *     jobs: factory.create('jobs'),
 *     customers: factory.create('customers'),
 *     addresses: factory.create('addresses')
 * };
 *
 * function App() {
 *     return (
 *         <CollectionsProvider collections={collections}>
 *             <YourApp />
 *         </CollectionsProvider>
 *     );
 * }
 * ```
 */
export function CollectionsProvider({ collections, children }: CollectionsProviderProps) {
    return (
        <CollectionsContext.Provider value={collections}>
            {children}
        </CollectionsContext.Provider>
    );
}

/**
 * Hook to access a single collection from the provider.
 * Returns the Collection instance for the specified key.
 *
 * @template T - The record type for the collection
 * @param key - The collection key as defined in the provider
 * @returns The Collection instance
 * @throws Error if used outside of CollectionsProvider or if key doesn't exist
 *
 * @example
 * ```tsx
 * function JobsList() {
 *     const jobsCollection = useStore<JobsRecord>('jobs');
 *
 *     const { data } = useLiveQuery((q) =>
 *         q.from({ jobs: jobsCollection })
 *     );
 *
 *     return (
 *         <ul>
 *             {data?.map(job => <li key={job.id}>{job.name}</li>)}
 *         </ul>
 *     );
 * }
 * ```
 */
export function useStore<T extends object = object>(key: string): Collection<T> {
    const context = useContext(CollectionsContext);

    if (!context) {
        throw new Error('useStore must be used within a CollectionsProvider');
    }

    if (!(key in context)) {
        throw new Error(`Collection "${key}" not found in CollectionsProvider`);
    }

    return context[key] as Collection<T>;
}

/**
 * Hook to access multiple collections from the provider.
 * Returns an array of Collection instances matching the order of the keys array.
 *
 * @template T - Tuple type of record types for each collection
 * @param keys - Array of collection keys as defined in the provider
 * @returns Array of Collection instances in the same order as keys
 * @throws Error if used outside of CollectionsProvider or if any key doesn't exist
 *
 * @example
 * ```tsx
 * function JobsWithCustomers() {
 *     const [jobsCollection, customersCollection] = useStores<
 *         [JobsRecord, CustomersRecord]
 *     >(['jobs', 'customers']);
 *
 *     const { data } = useLiveQuery((q) =>
 *         q.from({ job: jobsCollection })
 *          .join(
 *              { customer: customersCollection },
 *              ({ job, customer }) => eq(job.customer, customer.id),
 *              'left'
 *          )
 *     );
 *
 *     return <div>...</div>;
 * }
 * ```
 */
export function useStores<T extends readonly object[]>(
    keys: readonly string[]
): { [K in keyof T]: Collection<T[K]> } {
    const context = useContext(CollectionsContext);

    if (!context) {
        throw new Error('useStores must be used within a CollectionsProvider');
    }

    const collections = keys.map((key) => {
        if (!(key in context)) {
            throw new Error(`Collection "${key}" not found in CollectionsProvider`);
        }
        return context[key];
    });

    return collections as { [K in keyof T]: Collection<T[K]> };
}
