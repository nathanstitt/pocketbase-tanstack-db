import PocketBase from 'pocketbase';
import { createCollection } from "@tanstack/db"
import { queryCollectionOptions } from "@tanstack/query-db-collection"
import { QueryClient } from '@tanstack/react-query'

export interface SchemaDeclaration {
    [collectionName: string]: {
        type: any;
        relations?: any;
    };
}

// Type utility to extract the record type from a schema collection
type ExtractRecordType<Schema extends SchemaDeclaration, CollectionName extends keyof Schema> = Schema[CollectionName]['type'];


// export declare class PocketBaseTS<TSchema extends SchemaDeclaration, TMaxDepth extends 0 | 1 | 2 | 3 | 4 | 5 | 6 = 2> extends PocketBase {
//     #private;
//     constructor(baseUrl?: string, authStore?: BaseAuthStore | null, lang?: string);
//     collection<TName extends (keyof TSchema & string) | (string & {})>(idOrName: TName): RecordServiceTS<TSchema, TName, TMaxDepth>;
//     createBatch(): BatchServiceTS<TSchema>;
// }


export class CollectionFactory<Schema extends SchemaDeclaration, TMaxDepth extends 0 | 1 | 2 | 3 | 4 | 5 | 6 = 2> {

    constructor(public pocketbase: PocketBase, public queryClient: QueryClient){ }

    create<C extends keyof Schema & string>(collection: C) {
        type RecordType = ExtractRecordType<Schema, C>;

        return createCollection(
            queryCollectionOptions<RecordType>({
                queryKey: [collection],
                queryFn: async () => {
                    const result = await this.pocketbase.collection(collection).getFullList();
                    return result as unknown as RecordType[];
                },
                queryClient: this.queryClient,
                getKey: (item: RecordType) => (item as any).id as string,
            })
        )

    }
}
