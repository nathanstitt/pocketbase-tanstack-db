# pbtsdb: PocketBase TanStack Database Integration

> Type-safe PocketBase integration with TanStack Query and TanStack DB

A TypeScript library that seamlessly integrates [PocketBase](https://pocketbase.io) with [TanStack Query](https://tanstack.com/query) and [TanStack DB](https://tanstack.com/db), providing:

- 🔥 **Real-time subscriptions** with automatic synchronization
- 🎯 **Full TypeScript type safety** for queries and relations
- ⚡ **Reactive collections** with TanStack DB
- 🔄 **Automatic caching** via TanStack Query
- ✨ **Optimistic mutations** with insert/update/delete support
- 🎨 **React hooks** for easy component integration
- 🔗 **Type-safe joins** and relation expansion

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
  - [CollectionFactory](#collectionfactory)
  - [React Provider](#react-provider)
  - [Subscriptions](#subscriptions)
- [Usage Examples](#usage-examples)
  - [Basic Queries](#basic-queries)
  - [Filtering and Sorting](#filtering-and-sorting)
  - [Relations and Joins](#relations-and-joins)
  - [Real-time Updates](#real-time-updates)
  - [Mutations](#mutations)
- [TypeScript](#typescript)
- [Best Practices](#best-practices)

## Installation

```bash
npm install pocketbase-tanstack-db pocketbase @tanstack/react-query @tanstack/react-db @tanstack/query-db-collection
```

### Peer Dependencies

- `pocketbase` >= 0.21.0
- `@tanstack/react-query` >= 5.0.0
- `@tanstack/react-db` >= 0.1.0
- `@tanstack/query-db-collection` >= 1.0.0
- `react` >= 18.0.0
- `react-dom` >= 18.0.0

## Quick Start

Let's build a **real-world blog** with posts, authors, and comments using pbtsdb.

### 1. Define Your Schema

First, generate your types from PocketBase. Install [pocketbase-schema-generator](https://github.com/satohshi/pocketbase-schema-generator) as a PocketBase hook to auto-generate types on schema changes.

```typescript
// schema.ts - Auto-generated from PocketBase
interface Post {
    id: string;
    title: string;
    content: string;
    author: string;      // FK to users
    published: boolean;
    created: string;
    updated: string;
}

interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    created: string;
    updated: string;
}

interface Comment {
    id: string;
    post: string;        // FK to posts
    author: string;      // FK to users
    text: string;
    created: string;
    updated: string;
}

// Schema declaration for pbtsdb
type BlogSchema = {
    posts: {
        type: Post;
        relations: { author: User };
    };
    users: {
        type: User;
        relations: {};
    };
    comments: {
        type: Comment;
        relations: {
            post: Post;
            author: User;
        };
    };
}
```

### 2. Set Up Your App

```typescript
// app.tsx
import PocketBase from 'pocketbase';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createCollection, createReactProvider } from 'pocketbase-tanstack-db';

const pb = new PocketBase('http://localhost:8090');
const queryClient = new QueryClient({
    defaultOptions: {
        queries: { staleTime: 60_000 } // Cache for 1 minute
    }
});

// Create collections with automatic type inference
const c = createCollection<BlogSchema>(pb, queryClient);
export const { Provider, useStore } = createReactProvider({
    posts: c('posts', {
        omitOnInsert: ['created', 'updated'] as const
    }),
    users: c('users', {}),
    comments: c('comments', {
        omitOnInsert: ['created', 'updated'] as const
    })
});

export function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <Provider>
                <BlogDashboard />
            </Provider>
        </QueryClientProvider>
    );
}
```

### 3. Build Your Components

```typescript
// BlogDashboard.tsx
import { useLiveQuery } from '@tanstack/react-db';
import { useStore } from './app';

export function BlogDashboard() {
    const [posts] = useStore(['posts']);

    const { data: allPosts, isLoading } = useLiveQuery((q) =>
        q.from({ posts })
            .orderBy(({ posts }) => posts.created, 'desc')
    );

    if (isLoading) return <div>Loading posts...</div>;

    return (
        <div>
            <h1>Blog Posts</h1>
            {allPosts?.map(post => (
                <article key={post.id}>
                    <h2>{post.title}</h2>
                    <p>{post.content}</p>
                    {/* Expanded author is fully typed! */}
                    <small>By {post.expand?.author?.username}</small>
                </article>
            ))}
        </div>
    );
}
```

### 4. Add Real-time Comments

```typescript
// PostWithComments.tsx
import { useLiveQuery } from '@tanstack/react-db';
import { eq } from '@tanstack/db';
import { useStore } from './app';
import { newRecordId } from 'pocketbase-tanstack-db';

export function PostWithComments({ postId }: { postId: string }) {
    const [comments, posts] = useStore(['comments', 'posts'] as const);

    // Real-time comments for this post
    const { data: postComments } = useLiveQuery((q) =>
        q.from({ comments })
            .where(({ comments }) => eq(comments.post, postId))
            .orderBy(({ comments }) => comments.created, 'desc')
    );

    const handleAddComment = (text: string, authorId: string) => {
        comments.insert({
            id: newRecordId(),
            post: postId,
            author: authorId,
            text
        });
        // Comment appears instantly (optimistic), syncs to PocketBase in background
    };

    return (
        <div>
            <h3>Comments ({postComments?.length || 0})</h3>
            {postComments?.map(comment => (
                <div key={comment.id}>
                    <strong>{comment.expand?.author?.username}:</strong>
                    <p>{comment.text}</p>
                </div>
            ))}
            <CommentForm onSubmit={handleAddComment} />
        </div>
    );
}
```

**That's it!** You now have a real-time blog with:
- ✅ Type-safe queries
- ✅ Automatic real-time updates
- ✅ Optimistic mutations
- ✅ Expanded relations

## Core Concepts

### Collections

Collections are reactive data stores that automatically sync with PocketBase:

```typescript
// Create a collection
const booksCollection = factory.create('books');

// Collections automatically:
// - Fetch data from PocketBase
// - Subscribe to real-time updates
// - Update React components when data changes
// - Cache data via TanStack Query
```

### Real-time Subscriptions

Collections manage subscriptions **automatically** based on query lifecycle:

```typescript
// Collections are lazy - no subscription until queried
const booksCollection = factory.create('books');

// Subscription starts automatically when query becomes active
const { data } = useLiveQuery((q) =>
    q.from({ books: booksCollection })
);
// ✅ Subscribed to changes while component is mounted
// ✅ Unsubscribes automatically when component unmounts (with 5s cleanup delay)

// Advanced: Manual subscription control
await booksCollection.subscribe(); // Subscribe to all
await booksCollection.subscribe('record_id'); // Subscribe to specific record
booksCollection.unsubscribe('record_id'); // Unsubscribe from specific record
booksCollection.unsubscribeAll(); // Clear all subscriptions
```

### Type Safety

Full TypeScript support with compile-time type checking:

```typescript
const { data } = useLiveQuery((q) =>
    q.from({ books: booksCollection })
);

// TypeScript knows:
// - data[0].title is a string
// - data[0].genre is 'Fiction' | 'Non-Fiction' | 'Science Fiction'
// - data[0].author is a string (FK)
```

## API Reference

### CollectionFactory

The main class for creating type-safe collections.

#### Constructor

```typescript
new CollectionFactory<Schema>(pocketbase: PocketBase, queryClient: QueryClient)
```

**Parameters:**
- `pocketbase`: PocketBase instance
- `queryClient`: TanStack Query QueryClient instance

**Example:**
```typescript
const factory = new CollectionFactory<MySchema>(pb, queryClient);
```

#### create()

Creates a reactive collection from a PocketBase collection.

```typescript
create<CollectionName>(
    collection: CollectionName,
    options?: CreateCollectionOptions
): Collection & SubscribableCollection
```

**Options:**
- `expandable?: Record<string, Collection>` - Relations that CAN be expanded at query-time with `.expand()`
- `relations?: Record<string, Collection>` - Collections for manual joins
- `startSync?: boolean` - Start syncing immediately (default: `false`, lazy)
- `onInsert?: InsertMutationFn | false` - Custom insert handler or `false` to disable
- `onUpdate?: UpdateMutationFn | false` - Custom update handler or `false` to disable
- `onDelete?: DeleteMutationFn | false` - Custom delete handler or `false` to disable

**Examples:**

Basic collection (lazy, subscribes automatically on first query):
```typescript
const booksCollection = factory.create('books');
```

With relations for joins:
```typescript
const authorsCollection = factory.create('authors');
const booksCollection = factory.create('books', {
    relations: {
        author: authorsCollection
    }
});
```

With query-time expand (advanced):
```typescript
const authorsCollection = factory.create('authors');
const booksCollection = factory.create('books', {
    expandable: {
        author: authorsCollection  // Can be expanded per-query
    }
});

// Use .expand() method to choose which relations to expand
const booksWithAuthor = booksCollection.expand(['author'] as const);
const { data } = useLiveQuery((q) => q.from({ books: booksWithAuthor }));

// Expanded records auto-inserted into authorsCollection
```

### React Integration

#### createCollection()

Creates a single type-safe collection backed by PocketBase. Use the curried API to create multiple collections.

```typescript
const createCol = createCollection<Schema>(pb: PocketBase, queryClient: QueryClient);
const collection = createCol(collectionName: string, options?: CreateCollectionOptions);
```

**Parameters:**
- `pb` - PocketBase instance
- `queryClient` - TanStack Query QueryClient instance
- `collectionName` - Name of the PocketBase collection
- `options` - Optional configuration (omitOnInsert, expandable, relations, etc.)

**Returns:** Fully-typed Collection instance with subscription capabilities

**Example:**
```typescript
import { createCollection } from 'pocketbase-tanstack-db';

const c = createCollection<MySchema>(pb, queryClient);
const authors = c('authors', {});
const books = c('books', {
    omitOnInsert: ['created', 'updated'] as const
});
```

#### createReactProvider()

Creates a React Provider and useStore hook for accessing collections.

```typescript
const { Provider, useStore } = createReactProvider(collections: CollectionsMap);
```

**Parameters:**
- `collections` - Object mapping keys to Collection instances

**Returns:**
- `Provider` - React Context Provider component
- `useStore` - Hook to access collections (takes an array, returns typed tuple)

**Example:**
```typescript
import { createCollection, createReactProvider } from 'pocketbase-tanstack-db';

const c = createCollection<MySchema>(pb, queryClient);
const collections = {
    authors: c('authors', {}),
    books: c('books', {}),
};

const { Provider, useStore } = createReactProvider(collections);

// Wrap your app
<Provider>
    <App />
</Provider>
```

**With custom collection key:**
```typescript
const collections = {
    myBooks: c('books', {})  // Key 'myBooks', collection 'books'
};

const { Provider, useStore } = createReactProvider(collections);

// Access via custom key
const [myBooks] = useStore(['myBooks']);
```

#### useStore()

Access collections from the provider. Always takes an array and returns a typed tuple.

**Single collection:**
```typescript
const [collection] = useStore(['key'])
```

**Multiple collections (use `as const` for proper type inference):**
```typescript
const [col1, col2, col3] = useStore(['key1', 'key2', 'key3'] as const)
```

**Examples:**
```typescript
function BooksList() {
    const [books] = useStore(['books']);  // ✅ Typed automatically!

    const { data } = useLiveQuery((q) =>
        q.from({ books })
    );

    return <div>{/* ... */}</div>;
}

function BooksWithAuthors() {
    const [books, authors] = useStore(['books', 'authors'] as const);  // ✅ Array-based!

    const { data } = useLiveQuery((q) =>
        q.from({ book: books })
            .join(
                { author: authors },
                ({ book, author }) => eq(book.author, author.id),
                'left'
            )
    );

    return <div>{/* ... */}</div>;
}
```

### Subscriptions

Collections support real-time subscriptions to PocketBase.

#### subscribe()

Subscribe to collection changes.

```typescript
// Subscribe to all records
await collection.subscribe();

// Subscribe to specific record
await collection.subscribe('record_id');
```

#### unsubscribe()

Unsubscribe from changes.

```typescript
// Unsubscribe from all
collection.unsubscribe();

// Unsubscribe from specific record
collection.unsubscribe('record_id');
```

#### unsubscribeAll()

Clear all subscriptions for a collection.

```typescript
collection.unsubscribeAll();
```

#### isSubscribed()

Check subscription status.

```typescript
// Check collection-wide subscription
const isSubbed = collection.isSubscribed(); // boolean

// Check specific record subscription
const isRecordSubbed = collection.isSubscribed('record_id'); // boolean
```

#### waitForSubscription()

Wait for subscription to be established (useful in tests).

```typescript
await collection.waitForSubscription(); // Wait for collection-wide
await collection.waitForSubscription('record_id'); // Wait for specific record
await collection.waitForSubscription(undefined, 5000); // With timeout
```

### Utility Functions

#### newRecordId()

Generate a PocketBase-compatible record ID (15-character alphanumeric string).

```typescript
import { newRecordId } from 'pocketbase-tanstack-db';

const id = newRecordId(); // "a1b2c3d4e5f6g7h"

// Use when creating records
const newBook = {
    id: newRecordId(),
    title: 'New Book',
    // ... other fields
};

booksCollection.insert(newBook);
```

**Returns:** `string` - 15-character lowercase alphanumeric ID

## Usage Examples

### Example 1: Building a Task Manager

Complete example showing filtering, updates, and real-time collaboration.

```typescript
// schema.ts
interface Task {
    id: string;
    title: string;
    status: 'todo' | 'in_progress' | 'done';
    assignee: string;  // FK to users
    due_date?: string;
    created: string;
    updated: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    created: string;
    updated: string;
}

type TaskSchema = {
    tasks: {
        type: Task;
        relations: { assignee: User };
    };
    users: {
        type: User;
        relations: {};
    };
}

// TaskBoard.tsx
import { useLiveQuery } from '@tanstack/react-db';
import { eq, and, gt } from '@tanstack/db';
import { useStore } from './app';

export function TaskBoard({ userId }: { userId: string }) {
    const tasks = useStore('tasks');

    // Filter tasks by status and assignee - updates in real-time
    const { data: myTasks } = useLiveQuery((q) =>
        q.from({ tasks })
            .where(({ tasks }) => and(
                eq(tasks.assignee, userId),
                eq(tasks.status, 'in_progress')
            ))
            .orderBy(({ tasks }) => tasks.due_date, 'asc')
    );

    // Find overdue tasks
    const today = new Date().toISOString().split('T')[0];
    const { data: overdueTasks } = useLiveQuery((q) =>
        q.from({ tasks })
            .where(({ tasks }) => and(
                eq(tasks.assignee, userId),
                tasks.due_date < today,
                tasks.status !== 'done'
            ))
    );

    const handleCompleteTask = (taskId: string) => {
        // Optimistic update - UI updates instantly
        tasks.update(taskId, (draft) => {
            draft.status = 'done';
        });
    };

    return (
        <div>
            {overdueTasks && overdueTasks.length > 0 && (
                <div className="alert">
                    ⚠️ You have {overdueTasks.length} overdue tasks!
                </div>
            )}

            <h2>My Tasks ({myTasks?.length || 0})</h2>
            {myTasks?.map(task => (
                <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={() => handleCompleteTask(task.id)}
                />
            ))}
        </div>
    );
}
```

### Example 2: E-commerce Product Catalog with Search

Real-world product browsing with filtering, search, and categories.

```typescript
// ProductCatalog.tsx
import { useLiveQuery } from '@tanstack/react-db';
import { and, or, gte, lte } from '@tanstack/db';
import { useStore } from './app';
import { useState } from 'react';

interface Product {
    id: string;
    name: string;
    price: number;
    category: 'electronics' | 'clothing' | 'books';
    in_stock: boolean;
    rating: number;
    created: string;
    updated: string;
}

export function ProductCatalog() {
    const products = useStore('products');
    const [category, setCategory] = useState<string | null>(null);
    const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
    const [sortBy, setSortBy] = useState<'price' | 'rating'>('rating');

    // Dynamic filtering based on user selections
    const { data: filteredProducts, isLoading } = useLiveQuery((q) => {
        let query = q.from({ products });

        // Apply filters
        const conditions = [];

        if (category) {
            conditions.push(products.category === category);
        }

        conditions.push(
            and(
                gte(products.price, priceRange.min),
                lte(products.price, priceRange.max)
            )
        );

        // Only show in-stock items
        conditions.push(products.in_stock === true);

        if (conditions.length > 0) {
            query = query.where(({ products }) => and(...conditions));
        }

        // Apply sorting
        return query.orderBy(
            ({ products }) => sortBy === 'price' ? products.price : products.rating,
            sortBy === 'price' ? 'asc' : 'desc'
        );
    });

    return (
        <div>
            <div className="filters">
                <select onChange={(e) => setCategory(e.target.value || null)}>
                    <option value="">All Categories</option>
                    <option value="electronics">Electronics</option>
                    <option value="clothing">Clothing</option>
                    <option value="books">Books</option>
                </select>

                <input
                    type="range"
                    min="0"
                    max="1000"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: +e.target.value })}
                />
                <span>Max: ${priceRange.max}</span>

                <button onClick={() => setSortBy('price')}>Sort by Price</button>
                <button onClick={() => setSortBy('rating')}>Sort by Rating</button>
            </div>

            {isLoading && <div>Loading products...</div>}

            <div className="products">
                {filteredProducts?.length === 0 ? (
                    <p>No products found matching your criteria</p>
                ) : (
                    filteredProducts?.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))
                )}
            </div>
        </div>
    );
}
```

### Example 3: Social Media Feed with Nested Relations

Building a Twitter-like feed with posts, authors, and likes.

```typescript
// SocialFeed.tsx
import { useLiveQuery } from '@tanstack/react-db';
import { eq } from '@tanstack/db';
import { useStore } from './app';
import { newRecordId } from 'pocketbase-tanstack-db';

interface Post {
    id: string;
    content: string;
    author: string;     // FK to users
    likes_count: number;
    created: string;
    updated: string;
}

interface User {
    id: string;
    username: string;
    avatar?: string;
    created: string;
    updated: string;
}

interface Like {
    id: string;
    post: string;       // FK to posts
    user: string;       // FK to users
    created: string;
    updated: string;
}

export function SocialFeed({ currentUserId }: { currentUserId: string }) {
    const [posts, users, likes] = useStore('posts', 'users', 'likes');

    // Fetch posts with expanded author info (fast, single query)
    const { data: feedPosts } = useLiveQuery((q) =>
        q.from({ posts })
            .orderBy(({ posts }) => posts.created, 'desc')
    );

    // Check which posts the current user has liked
    const { data: userLikes } = useLiveQuery((q) =>
        q.from({ likes })
            .where(({ likes }) => eq(likes.user, currentUserId))
    );

    const likedPostIds = new Set(userLikes?.map(like => like.post) || []);

    const handleLike = async (postId: string) => {
        if (likedPostIds.has(postId)) {
            // Unlike: Find and delete the like
            const like = userLikes?.find(l => l.post === postId);
            if (like) {
                likes.delete(like.id);

                // Decrement like count
                posts.update(postId, (draft) => {
                    draft.likes_count -= 1;
                });
            }
        } else {
            // Like: Create new like
            likes.insert({
                id: newRecordId(),
                post: postId,
                user: currentUserId
            });

            // Increment like count
            posts.update(postId, (draft) => {
                draft.likes_count += 1;
            });
        }
    };

    return (
        <div className="feed">
            {feedPosts?.map(post => (
                <div key={post.id} className="post">
                    <div className="author">
                        <img src={post.expand?.author?.avatar} alt="" />
                        <strong>{post.expand?.author?.username}</strong>
                    </div>
                    <p>{post.content}</p>
                    <div className="actions">
                        <button
                            onClick={() => handleLike(post.id)}
                            className={likedPostIds.has(post.id) ? 'liked' : ''}
                        >
                            ❤️ {post.likes_count} likes
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
```

**Key Features:**
- ✅ Real-time updates when anyone likes/unlikes posts
- ✅ Optimistic UI - likes appear instantly
- ✅ Expanded author info with type safety
- ✅ Efficient queries using expand instead of joins

### Example 4: Real-time Collaborative Todo List

Multiple users editing the same list simultaneously with instant updates.

```typescript
// CollaborativeTodoList.tsx
import { useLiveQuery } from '@tanstack/react-db';
import { eq, and } from '@tanstack/db';
import { useStore } from './app';
import { newRecordId } from 'pocketbase-tanstack-db';
import { useState } from 'react';

interface Todo {
    id: string;
    text: string;
    completed: boolean;
    list_id: string;
    created_by: string;  // FK to users
    created: string;
    updated: string;
}

export function CollaborativeTodoList({ listId, currentUserId }: {
    listId: string;
    currentUserId: string;
}) {
    const todos = useStore('todos');
    const [newTodoText, setNewTodoText] = useState('');

    // Real-time todos - updates automatically when any user adds/edits
    const { data: allTodos } = useLiveQuery((q) =>
        q.from({ todos })
            .where(({ todos }) => eq(todos.list_id, listId))
            .orderBy(({ todos }) => todos.created, 'asc')
    );

    const handleAddTodo = () => {
        if (!newTodoText.trim()) return;

        // Optimistic insert - appears instantly for all users
        todos.insert({
            id: newRecordId(),
            text: newTodoText,
            completed: false,
            list_id: listId,
            created_by: currentUserId
        });

        setNewTodoText('');
    };

    const handleToggle = (todoId: string) => {
        // Optimistic update - checkbox toggles instantly
        todos.update(todoId, (draft) => {
            draft.completed = !draft.completed;
        });
    };

    const handleDelete = (todoId: string) => {
        // Optimistic delete - item disappears instantly
        todos.delete(todoId);
    };

    const handleBatchComplete = () => {
        // Batch multiple updates together for efficiency
        todos.utils.writeBatch(() => {
            allTodos?.forEach(todo => {
                if (!todo.completed) {
                    todos.update(todo.id, (draft) => {
                        draft.completed = true;
                    });
                }
            });
        });
    };

    const completedCount = allTodos?.filter(t => t.completed).length || 0;
    const totalCount = allTodos?.length || 0;

    return (
        <div>
            <h2>Todos ({completedCount}/{totalCount} completed)</h2>

            <div className="add-todo">
                <input
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                    placeholder="Add a new todo..."
                />
                <button onClick={handleAddTodo}>Add</button>
            </div>

            <div className="actions">
                <button onClick={handleBatchComplete}>
                    Complete All
                </button>
            </div>

            <ul>
                {allTodos?.map(todo => (
                    <li key={todo.id} className={todo.completed ? 'completed' : ''}>
                        <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => handleToggle(todo.id)}
                        />
                        <span>{todo.text}</span>
                        <button onClick={() => handleDelete(todo.id)}>
                            Delete
                        </button>
                        <small>by {todo.expand?.created_by?.username}</small>
                    </li>
                ))}
            </ul>
        </div>
    );
}
```

**What Happens in Real-time:**
1. **User A adds a todo** → User B sees it appear instantly
2. **User B checks it off** → User A sees the checkbox toggle
3. **User A deletes it** → User B sees it disappear
4. **Either user clicks "Complete All"** → Both see all items check off at once

**No manual subscription code needed!** Just use `useLiveQuery` and pbtsdb handles the rest.

### Example 5: Form Handling with Validation and Error Handling

Real-world form submission with optimistic updates and server validation.

```typescript
// CreateBookForm.tsx
import { useStore } from './app';
import { newRecordId } from 'pocketbase-tanstack-db';
import { useState } from 'react';
import { useLiveQuery } from '@tanstack/react-db';

interface Book {
    id: string;
    title: string;
    author: string;
    isbn: string;
    genre: string;
    published_date: string;
    created: string;
    updated: string;
}

export function CreateBookForm() {
    const books = useStore('books');
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        isbn: '',
        genre: 'Fiction',
        published_date: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Show all books in real-time
    const { data: allBooks } = useLiveQuery((q) =>
        q.from({ books })
            .orderBy(({ books }) => books.created, 'desc')
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            // Insert with optimistic update - book appears in list instantly!
            const transaction = books.insert({
                id: newRecordId(),
                ...formData
            });

            // Wait for server confirmation
            await transaction.isPersisted.promise;

            if (transaction.state === 'completed') {
                // Success! Reset form
                setFormData({
                    title: '',
                    author: '',
                    isbn: '',
                    genre: 'Fiction',
                    published_date: ''
                });
            } else if (transaction.state === 'error') {
                // Server validation failed - rollback happened automatically
                setError('Failed to create book. Please check your input.');
            }
        } catch (err: any) {
            // Handle PocketBase validation errors
            if (err.data) {
                const fieldErrors = Object.entries(err.data)
                    .map(([field, error]) => `${field}: ${error}`)
                    .join(', ');
                setError(`Validation errors: ${fieldErrors}`);
            } else {
                setError(err.message || 'Unknown error occurred');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (bookId: string) => {
        if (!confirm('Delete this book?')) return;

        // Optimistic delete - disappears from list instantly
        const transaction = books.delete(bookId);

        // Wait for confirmation (optional)
        await transaction.isPersisted.promise;

        if (transaction.state === 'error') {
            alert('Failed to delete book');
        }
    };

    return (
        <div>
            <h2>Add New Book</h2>

            {error && (
                <div className="error-message">
                    ❌ {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <input
                    required
                    placeholder="Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />

                <input
                    required
                    placeholder="Author ID"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />

                <input
                    required
                    placeholder="ISBN"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                />

                <select
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                >
                    <option value="Fiction">Fiction</option>
                    <option value="Non-Fiction">Non-Fiction</option>
                    <option value="Science Fiction">Science Fiction</option>
                </select>

                <input
                    required
                    type="date"
                    value={formData.published_date}
                    onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
                />

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Add Book'}
                </button>
            </form>

            <h2>All Books ({allBooks?.length || 0})</h2>
            <ul>
                {allBooks?.map(book => (
                    <li key={book.id}>
                        <strong>{book.title}</strong> by {book.expand?.author?.name}
                        <button onClick={() => handleDelete(book.id)}>Delete</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
```

**Key Features:**
- ✅ Optimistic updates - new books appear instantly
- ✅ Automatic rollback on server errors
- ✅ PocketBase validation error handling
- ✅ Real-time list updates
- ✅ Loading states during submission

### Example 6: Dashboard with Multiple Data Sources

Advanced example showing joins, aggregations, and combining multiple collections.

```typescript
// ProjectDashboard.tsx
import { useLiveQuery } from '@tanstack/react-db';
import { eq } from '@tanstack/db';
import { useStore } from './app';

interface Project {
    id: string;
    name: string;
    status: 'active' | 'completed' | 'archived';
    created: string;
    updated: string;
}

interface Task {
    id: string;
    project: string;
    title: string;
    completed: boolean;
    created: string;
    updated: string;
}

interface TeamMember {
    id: string;
    project: string;
    user: string;
    role: 'owner' | 'member';
    created: string;
    updated: string;
}

export function ProjectDashboard({ projectId }: { projectId: string }) {
    const [projects, tasks, teamMembers, users] = useStore(
        'projects',
        'tasks',
        'team_members',
        'users'
    );

    // Get project details
    const { data: projectList } = useLiveQuery((q) =>
        q.from({ projects })
            .where(({ projects }) => eq(projects.id, projectId))
    );
    const project = projectList?.[0];

    // Get all tasks for this project
    const { data: projectTasks } = useLiveQuery((q) =>
        q.from({ tasks })
            .where(({ tasks }) => eq(tasks.project, projectId))
    );

    // Calculate task statistics
    const totalTasks = projectTasks?.length || 0;
    const completedTasks = projectTasks?.filter(t => t.completed).length || 0;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Get team members with user details using join
    const { data: team } = useLiveQuery((q) =>
        q.from({ member: teamMembers })
            .where(({ member }) => eq(member.project, projectId))
            .join(
                { user: users },
                ({ member, user }) => eq(member.user, user.id),
                'left'
            )
            .select(({ member, user }) => ({
                id: member.id,
                role: member.role,
                user: user ? {
                    id: user.id,
                    name: user.name,
                    email: user.email
                } : undefined
            }))
    );

    // Get upcoming tasks (not completed)
    const upcomingTasks = projectTasks?.filter(t => !t.completed) || [];

    return (
        <div className="dashboard">
            <h1>{project?.name}</h1>

            <div className="stats">
                <div className="stat-card">
                    <h3>Progress</h3>
                    <div className="progress-bar">
                        <div style={{ width: `${progress}%` }} />
                    </div>
                    <p>{completedTasks} / {totalTasks} tasks completed</p>
                </div>

                <div className="stat-card">
                    <h3>Team Size</h3>
                    <p>{team?.length || 0} members</p>
                </div>

                <div className="stat-card">
                    <h3>Status</h3>
                    <p>{project?.status}</p>
                </div>
            </div>

            <div className="team">
                <h2>Team Members</h2>
                <ul>
                    {team?.map(member => (
                        <li key={member.id}>
                            {member.user?.name} ({member.role})
                        </li>
                    ))}
                </ul>
            </div>

            <div className="tasks">
                <h2>Upcoming Tasks ({upcomingTasks.length})</h2>
                <ul>
                    {upcomingTasks.map(task => (
                        <li key={task.id}>
                            <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => {
                                    tasks.update(task.id, (draft) => {
                                        draft.completed = !draft.completed;
                                    });
                                }}
                            />
                            {task.title}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
```

**What's Demonstrated:**
- ✅ Multiple collections accessed with variadic `useStore()`
- ✅ Client-side aggregations (task completion percentage)
- ✅ TanStack DB joins for nested user data
- ✅ Real-time dashboard updates
- ✅ Filtering and transformations

## TypeScript

pbtsdb is fully type-safe. Here's what you need to know:

### Define Your Schema

Use the simple schema format shown in the Quick Start:

```typescript
type MySchema = {
    collection_name: {
        type: RecordInterface;    // Your record type
        relations: {
            field_name: RelatedType;  // Related record types
        };
    };
}
```

**Pro tip:** Use [pocketbase-schema-generator](https://github.com/satohshi/pocketbase-schema-generator) to auto-generate types from your PocketBase database.

### Type-Safe Collections

Always create collections with proper type parameters:

```typescript
// ✅ Good - full type safety
const c = createCollection<MySchema>(pb, queryClient);
const books = c('books', {
    omitOnInsert: ['created', 'updated'] as const
});

// ✅ Good - with expandable relations
const authors = c('authors', {});
const books = c('books', {
    expandable: {
        author: authors
    }
});
```

## Best Practices

### 1. Define Collections Centrally

Define all collections once at app initialization:

```typescript
// ✅ Do this - centralized, type-safe
const c = createCollection<MySchema>(pb, queryClient);

export const { Provider, useStore } = createReactProvider({
    posts: c('posts', { omitOnInsert: ['created', 'updated'] as const }),
    users: c('users', {}),
    comments: c('comments', { omitOnInsert: ['created', 'updated'] as const })
});
```

### 2. Create Dependencies Before Dependents

When using expandable collections, create the target collection first:

```typescript
// ✅ Good - authors exists before books references it
const c = createCollection<MySchema>(pb, queryClient);
const authors = c('authors', {});
const books = c('books', {
    expandable: {
        author: authors  // authors is already created
    }
});

// ❌ Bad - can't reference what doesn't exist yet
const books = c('books', {
    expandable: {
        author: ???  // Where is authors?
    }
});
```

### 3. Subscriptions are Automatic

Don't manually subscribe - just use `useLiveQuery`:

```typescript
// ✅ Do this
const { data } = useLiveQuery((q) => q.from({ posts }));

// ❌ Don't do this
useEffect(() => {
    posts.subscribe();
    return () => posts.unsubscribe();
}, []);
```

### 4. Handle Loading States

Always check loading and error states:

```typescript
const { data, isLoading, error } = useLiveQuery((q) => q.from({ posts }));

if (isLoading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;
if (!data?.length) return <div>No posts found</div>;

return <PostsList posts={data} />;
```

### 5. Use Expandable for Performance

Use PocketBase's expand feature for better performance:

```typescript
// ✅ Fast - single query with server-side expand
const c = createCollection<MySchema>(pb, queryClient);
const authors = c('authors', {});
const posts = c('posts', {
    expandable: {
        author: authors
    }
});

const postsWithAuthor = posts.expand(['author'] as const);
const { data } = useLiveQuery((q) => q.from({ posts: postsWithAuthor }));

// ⚠️ Slower - multiple queries + client-side join
// Only use TanStack DB joins for inner/right/full join behavior
```

### 6. Configure QueryClient Defaults

```typescript
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60_000,      // 1 minute
            gcTime: 300_000,        // 5 minutes
            refetchOnWindowFocus: false
        }
    }
});
```

## Configuration

### Custom Logger Integration

By default, pbtsdb logs debug messages to the console in development mode. You can integrate with your own logging service (Sentry, LogRocket, etc.) using `setLogger`:

```typescript
import { setLogger } from 'pocketbase-tanstack-db';

// Example: Send errors to Sentry
setLogger({
    debug: (msg, context) => {
        // Custom debug handling (e.g., only log in dev)
        if (process.env.NODE_ENV === 'development') {
            console.debug('[pbtsdb]', msg, context);
        }
    },
    warn: (msg, context) => {
        console.warn('[pbtsdb]', msg, context);
        // Optional: Send to monitoring service
        myMonitoringService.warn(msg, context);
    },
    error: (msg, context) => {
        console.error('[pbtsdb]', msg, context);
        // Send errors to error tracking service
        Sentry.captureMessage(msg, {
            level: 'error',
            extra: context,
        });
    },
});
```

**Disable logging completely:**

```typescript
import { setLogger } from 'pocketbase-tanstack-db';

setLogger({
    debug: () => {},
    warn: () => {},
    error: () => {},
});
```

**Reset to default logger:**

```typescript
import { resetLogger } from 'pocketbase-tanstack-db';

resetLogger();
```

## License

ISC

## Contributing

Contributions welcome! Please open an issue or PR.

### Development Setup

**Prerequisites:**
- Node.js 18+
- Git

**Clone and Install:**
```bash
git clone https://github.com/yourusername/pocketbase-tanstack-db
cd pocketbase-tanstack-db
npm install
```

### Running Tests

Tests use a real PocketBase instance with **fully automated infrastructure**:

```bash
npm test  # Auto-resets DB → Starts server → Runs tests → Stops server
```

The `npm test` command automatically:
1. Resets the test database to a clean state
2. Applies migrations and creates test collections
3. Starts PocketBase server on port 8210
4. Runs all Vitest tests
5. Stops the server when complete

**No manual server setup required!** All test infrastructure is automated.

**Advanced (for watch mode or debugging):**
```bash
# Start test server manually
npm run test:server

# Run tests against running server (in another terminal)
npm run test:run

# Just reset database without starting server
npm run db:reset
```

### Code Quality

```bash
npm run checks      # Run TypeScript type checking and linting
npm run lint:fix    # Auto-fix linting issues
npm run typecheck   # TypeScript only
```

### Documentation

- See [AGENTS.md](AGENTS.md) for comprehensive development guidelines
- See [test/README.md](test/README.md) for detailed testing documentation

---

**Built with:**
- [PocketBase](https://pocketbase.io) - Backend-as-a-Service
- [TanStack Query](https://tanstack.com/query) - Powerful data fetching
- [TanStack DB](https://tanstack.com/db) - Reactive database
- [TypeScript](https://www.typescriptlang.org) - Type safety
