---
name: JB Jewellery API routing
description: How the Vite dev server proxies to the Express API, and the port pitfall
---

# API routing

- Frontend calls `/jb-api/...` (hardcoded in `src/lib/adminApi.ts` and `src/lib/api.ts`)
- Express API server mounts routes at `/api/...`
- Vite `server.proxy` in `vite.config.ts` rewrites `/jb-api` → `/api` and proxies to `localhost:8080`
- `strictPort: false` is required — if the port is already taken, Vite should pick the next one, not crash

**Why:** The frontend and API server run on separate ports in dev. Without the proxy rewrite, all API calls 404.

**How to apply:** If the proxy breaks, check vite.config.ts server.proxy config. API_PORT defaults to 8080.
