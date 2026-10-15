import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const configuredSite = process.env.SITE_URL?.trim();
let site;

if (configuredSite) {
  const parsedSite = new URL(configuredSite);
  if (!['http:', 'https:'].includes(parsedSite.protocol)) {
    throw new Error('SITE_URL must use http or https.');
  }
  if (parsedSite.pathname !== '/' || parsedSite.search || parsedSite.hash) {
    throw new Error('SITE_URL must be an origin without a path, query, or fragment.');
  }
  site = parsedSite.origin;
} else {
  console.warn('SITE_URL is not set: canonical, hreflang, and sitemap output are omitted.');
}

export default defineConfig({
  ...(site ? { site } : {}),
  output: 'static',
  integrations: site ? [sitemap()] : [],
  vite: {
    plugins: [tailwindcss()],
  },
});
