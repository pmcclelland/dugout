import { existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Nitro writes a header-only `/assets/*` route with no `continue`. Vercel stops
 * at the first match, so the stylesheet never reaches `handle: filesystem`.
 */
export function continueHeaderRoutes(config) {
  if (!config?.routes) return config;
  for (const route of config.routes) {
    if (!route || route.handle || route.dest || route.status) continue;
    if (route.headers && route.src && route.continue !== true) route.continue = true;
  }
  return config;
}

function main() {
  const path = join(process.cwd(), ".vercel/output/config.json");
  if (!existsSync(path)) {
    console.error("[vercel-asset-routes] .vercel/output/config.json missing");
    process.exit(1);
  }
  const config = continueHeaderRoutes(JSON.parse(readFileSync(path, "utf8")));
  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`);
  const open = config.routes.filter((route) => route.continue === true).map((route) => route.src);
  console.log(`[vercel-asset-routes] continue: ${open.join(", ") || "(none)"}`);
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main();
