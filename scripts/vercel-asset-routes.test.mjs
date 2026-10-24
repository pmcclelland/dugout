import assert from "node:assert/strict";
import { test } from "node:test";
import { continueHeaderRoutes } from "./vercel-asset-routes.mjs";

test("header-only asset routes continue to the filesystem", () => {
  const config = continueHeaderRoutes({
    routes: [
      {
        src: "/assets/(.*)",
        headers: { "cache-control": "public, max-age=31536000, immutable" },
      },
      {
        src: "/redirect",
        status: 308,
        headers: { Location: "https://example.com/" },
      },
      { handle: "filesystem" },
      { src: "/(.*)", dest: "/__server" },
    ],
  });
  assert.equal(config.routes[0].continue, true);
  assert.equal(config.routes[1].continue, undefined);
  assert.equal(config.routes[2].continue, undefined);
  assert.equal(config.routes[3].continue, undefined);
});
