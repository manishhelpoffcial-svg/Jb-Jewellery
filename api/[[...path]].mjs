/**
 * Vercel catch-all serverless function.
 * Handles all /api/* routes by forwarding to the pre-built Express app.
 * Built during Vercel build step: pnpm --filter @workspace/api-server run build
 */
export { default } from "../artifacts/api-server/dist/handler.mjs";
