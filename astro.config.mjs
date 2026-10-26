// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  // Authentication uses Supabase cookie sessions (see src/lib/supabase.ts), not Astro's own
  // session runtime. Leaving this enabled makes the Cloudflare adapter wire a default KV driver,
  // which auto-provisions a `SESSION` KV namespace on every deploy. That binding change blocks
  // `wrangler rollback` between versions, so it must never reach the first production deploy.
  session: false,
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare(),
  env: {
    schema: {
      SUPABASE_URL: envField.string({ context: "server", access: "secret", optional: true }),
      SUPABASE_KEY: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },
});
