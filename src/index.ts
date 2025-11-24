/**
 * pocketbase-tanstack-db: Type-safe PocketBase integration with TanStack DB
 *
 * This library bridges PocketBase (backend-as-a-service) with TanStack's
 * reactive database and query management tools, providing type-safe collection
 * management with real-time data synchronization.
 *
 * @packageDocumentation
 */

export { CollectionFactory } from './collection';

export {
    createReactCollections,
    defineCollection,
    type CollectionConfig,
    type CollectionsConfig,
    type ReactCollectionsResult,
} from './react.js';

export { SubscriptionManager, SUBSCRIPTION_CONFIG } from './subscription-manager';

export { setLogger, resetLogger, type Logger } from './logger';

export { newRecordId } from './util';

export type {
    SchemaDeclaration,
    SubscribableCollection,
    JoinHelper,
    CreateCollectionOptions,
    RelationsConfig,
    RealtimeEvent,
    SubscriptionState,
    WithExpand,
    ExtractRecordType,
    ExtractRelations,
    ExpandableFields,
    ParseExpandFields,
    NonNullable,
    RelationAsCollection,
} from './types';
