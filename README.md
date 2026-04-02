# Stateful Backends

## What is a Stateful Backend?

A **stateful backend** is a server that retains information (state) between requests. Each request can read from and write to shared data that persists across the lifetime of the server process. This means the server "remembers" what happened in previous requests and uses that context to handle future ones.

---

## Stateful vs. Stateless Backends

| | Stateful | Stateless |
|---|---|---|
| **Memory between requests** | Yes — server holds in-memory or session state | No — each request is fully self-contained |
| **Scalability** | Harder to scale horizontally (state is local to an instance) | Easy to scale horizontally (any instance can handle any request) |
| **Complexity** | Higher — state management, consistency, and lifecycle must be considered | Lower — no shared state to reason about |
| **Fault tolerance** | State is lost if the process crashes (unless persisted externally) | Naturally resilient — no state to lose |
| **Examples** | WebSocket servers, shopping cart services, multiplayer game servers | REST APIs backed by a database, microservices, static file servers |

In a **stateless** architecture, any data that needs to outlive a single request is pushed out to an external store (database, cache, object storage). The server itself holds nothing between calls.

In a **stateful** architecture, the server process itself is the source of truth for at least some data. Clients interact with a specific server instance (or that state is replicated/shared) to get consistent results.

---

## Common Use Cases for Stateful Backends

- **Real-time collaboration** — e.g., shared document editing, where active users and document deltas live in memory for low latency.
- **WebSocket / long-lived connections** — chat applications, live dashboards, or multiplayer games where connection context must persist.
- **Session management** — tracking a user's login session, cart contents, or wizard progress across multiple HTTP requests.
- **In-process caching** — accumulating results or aggregations in memory to avoid repeated expensive computations or database queries.
- **Prototype / development servers** — rapidly iterating on an API without setting up an external database.

---

## Implementation in This Repository

This project implements a stateful Express.js API written in TypeScript. State lives entirely in memory for the duration of the server process, demonstrated through a simple store-and-product management service.

### Project Structure

```
src/
├── index.ts    — Express app and route definitions
├── db.ts       — Exports the single shared database instance
├── store.ts    — StoreManager class (Singleton) — the in-memory state
└── logger.ts   — Structured logger that reads from shared state
```

### The Singleton Pattern (`store.ts`)

The heart of the stateful design is the `StoreManager` class, which uses the **Singleton pattern** to guarantee that only one instance exists for the entire lifetime of the server process:

```ts
class StoreManager {
    static instance: StoreManager | null = null;

    static getInstance(): StoreManager {
        if (!StoreManager.instance) {
            StoreManager.instance = new StoreManager();
        }
        return StoreManager.instance;
    }

    private stores: Store[] = [];
    // ...
}
```

- The `stores` array is held in memory as private state on the single instance.
- `addStore()` and `addProductToStore()` mutate that array, persisting changes across all subsequent requests.
- `getStoreById()` allows any part of the app to read the current state.

Because `StoreManager.instance` is a module-level static, it survives as long as the Node.js process is running. Every request handler and the logger see the same object.

### Shared Database Reference (`db.ts`)

```ts
import { StoreManager } from './store.js';

export const db = StoreManager.getInstance();
```

`db.ts` calls `getInstance()` once at module load time and re-exports the result. Any file that imports `db` gets a reference to the same `StoreManager` object, making the shared state a first-class citizen across the whole application.

### API Routes (`index.ts`)

| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/` | Health check — returns `Hello, World!` |
| `POST` | `/store` | Creates a new store and stores it in memory |
| `POST` | `/store/:id/product` | Adds a product to an existing in-memory store |

Both mutation routes write directly to the shared `db` instance:

```ts
app.post('/store', (req, res) => {
    const { id, name } = req.body;
    db.addStore({ id, name, products: [] });   // mutates in-memory state
    Logger.logStoreCreation(id);
    res.status(201).json({ message: 'Store created successfully.' });
});
```

Because `db` is the same Singleton instance, a store created in one request is immediately visible to all subsequent requests — this is the defining characteristic of a stateful backend.

### Structured Logger (`logger.ts`)

The `Logger` class is also stateful-aware: it reads from the shared `db` at log time to include the store name alongside the ID, without the caller needing to pass that data explicitly:

```ts
static logStoreCreation(storeId: string) {
    const store = db.getStoreById(storeId);   // reads current in-memory state
    Logger.log(`Store created: ${store.name} (ID: ${store.id})`);
}
```

### Running the Server

```bash
npm run dev
```

The server starts on **port 3000**. All data lives in memory and is reset whenever the process restarts.

---

## Caveats and Next Steps

- **No persistence** — data is lost on restart. For production use, replace the in-memory `stores` array with a real database (PostgreSQL, MongoDB, Redis, etc.).
- **Single-instance only** — the Singleton pattern means this architecture does not scale horizontally out of the box. Running multiple instances would result in each holding its own isolated state.
- **No request body parsing middleware** — the current routes that read `req.body` require `express.json()` middleware to be added to `index.ts`.
