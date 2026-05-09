# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server with ts-node (src/server.ts)
npm run build      # Compile TypeScript to dist/
npm start          # Run compiled output (dist/server.js)
npm run lint       # Run ESLint on src/
npm run lint:fix   # Auto-fix linting issues
npm run format     # Run Prettier
npm run typecheck  # Type-check without emitting
```

No test framework is configured.

## Architecture

Express + TypeScript API with MySQL (mysql2/promise), JWT auth, and Socket.IO for real-time events.

**Entry flow:** `src/server.ts` → creates HTTP server → initializes Socket.IO → connects MySQL pool → auto-discovers routes from `src/routes/` recursively → listens on `PORT` (default 5000).

### Module pattern

Business logic lives in `src/modules/{domain}/{action}.ts`. Each handler follows this shape:

1. Validate required fields with `isEmpty()` from `@utils/isEmpty`
2. Check user permissions via `USER_PERMISSOES` table query
3. Execute SQL using the pool from `@config/database`
4. Update denormalized counters (e.g. `CONT_POSTS`, `CONT_SEGUIDORES`) — never use `COUNT(*)` queries
5. Emit Socket.IO event if relevant
6. Return using response helpers from `@utils/response`

Routes in `src/routes/{domain}/index.ts` wire modules to Express, applying `authMiddleware` and `permissaoMiddleware` as needed.

### Path aliases (tsconfig)

| Alias | Resolves to |
|---|---|
| `@config/*` | `src/config` |
| `@modules/*` | `src/modules` |
| `@middleware/*` | `src/middleware` |
| `@utils/*` | `src/utils` |
| `@socket/*` | `src/socket` |

### Authentication

- `src/middleware/auth.ts` — verifies `x-access-token` header (JWT, 1-day expiry)
- `src/middleware/permissao.ts` — checks `ALLOW_*` flags decoded from the token
- `src/utils/jwt.ts` — token generation and verification helpers
- Refresh tokens (7-day expiry) are stored in a `refresh_tokens` table initialized on startup

Permission flags: `ALLOW_POST`, `ALLOW_COMENTAR`, `ALLOW_CRIAR_PROBLEMA`, `ALLOW_APOIAR_PROBLEMA`, `ALLOW_CURTIR`, `ALLOW_ADMIN`.

### Database conventions

- **No foreign keys** — referential integrity is enforced in application code
- **Pre-calculated counters** — `CONT_POSTS`, `CONT_SEGUIDORES`, etc. on `USERS`; always increment/decrement alongside INSERTs/DELETEs
- **Polymorphic references** — `REFERENCIA_TIPO` + `REFERENCIA_ID` pattern used for comments and notifications
- **No migration tool** — schema changes are done manually; `database/seed_data.sql` has seed data

### Real-time

`src/socket/index.ts` authenticates connections via JWT, tracks online users in a `Map<userId, socketId>`, and emits domain events (`novo_post`, `novo_problema`, `users_online`).

### Response helpers (`@utils/response`)

```ts
responseSuccess(res, data)        // 200
responseBadRequest(res, message)  // 400
responseUnauthorized(res, message)// 401
responseNotFound(res, message)    // 404
responseError(res, error)         // 500 + console.error
```

### Cache (`@utils/cache`)

Redis-backed with in-memory fallback. Not actively used in most handlers yet — infrastructure is ready.

## Environment

Required `.env` variables:

```
PORT=5000
NODE_ENV=development
DB_HOST, DB_USER, DB_PASS, DB_NAME
SECRET_KEY, REFRESH_SECRET
SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
```
