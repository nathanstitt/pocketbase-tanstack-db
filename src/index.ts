/**
 * pocketbase-tanstack-db: Type-safe PocketBase integration with TanStack DB
 *
 * This library bridges PocketBase (backend-as-a-service) with TanStack's
 * reactive database and query management tools, providing type-safe collection
 * management with real-time data synchronization.
 *
 * @packageDocumentation
 */

// Import query builder extensions for side effects (module augmentation + prototype extension)
import './query-builder-extensions';

export { createCollection } from './collection';

export {
    createExpandFactory,
    type ExpandFactory,
} from './query-builder-extensions';

export {
    createReactProvider,
    type ReactProviderResult,
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
