/**
 * pbtsdb: Type-safe PocketBase integration with TanStack DB
 *
 * Bridges PocketBase with TanStack's reactive database and query tools,
 * providing type-safe collection management with real-time synchronization.
 *
 * @packageDocumentation
 */

export { createCollection } from './collection';

export {
    createReactProvider,
    type ReactProviderResult,
} from './react.js';

export { setLogger, resetLogger, type Logger } from './logger';

export { newRecordId } from './util';

export type {
    SchemaDeclaration,
    CreateCollectionOptions,
    WithExpand,
    ExtractRecordType,
    ExtractRelations,
    ParseExpandFields,
    ExcludeUndefined,
    RelationAsCollection,
    OmittableFields,
} from './types';
