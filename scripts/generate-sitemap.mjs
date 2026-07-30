// Generates public/sitemap.xml and public/robots.txt from the MDX tree.
// Runs before `next build` (see the build script in package.json).
//
// Pages whose front matter carries `untranslated: true` are placeholder stubs
// that only tell the reader the article exists in Uzbek. They are excluded here
// and served with `noindex` (see theme.config.tsx) so they don't compete with
// the real article as duplicate content.

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SITE = 'https://devops-journey.uz';
const PAGES_DIR = 'pages';

// Locale directory suffix -> hreflang code. The `en-UZ` locale holds Uzbek
// content, so it must be advertised as `uz` regardless of the Next.js locale id.
const LOCALES = {
  'en-UZ': { hreflang: 'uz', prefix: '' },
  en: { hreflang: 'en', prefix: '/en' },
  ru: { hreflang: 'ru', prefix: '/ru' },
};

const DEFAULT_LOCALE = 'en-UZ';
const EXCLUDED = new Set(['404', '500']);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'api') continue;
      out.push(...walk(full));
    } else if (entry.name.endsWith('.mdx')) {
      out.push(full);
    }
  }
  return out;
}

function isUntranslated(file) {
  const src = readFileSync(file, 'utf8');
  if (!src.startsWith('---')) return false;
  const end = src.indexOf('\n---', 3);
  if (end === -1) return false;
  return /^untranslated:\s*true\s*$/m.test(src.slice(3, end));
}

// pages/guides/ci-cd/nexus.en-UZ.mdx -> { route: '/guides/ci-cd/nexus', locale: 'en-UZ' }
function parse(file) {
  const rel = relative(PAGES_DIR, file).split(sep).join('/');
  const match = rel.match(/^(.*)\.([a-zA-Z-]+)\.mdx$/);
  if (!match) return null;
  const [, path, locale] = match;
  if (!LOCALES[locale]) return null;
  const base = path.split('/').pop();
  if (base.startsWith('_') || EXCLUDED.has(base)) return null;
  const route = path === 'index' ? '/' : `/${path}`.replace(/\/index$/, '');
  return { route, locale };
}

const byRoute = new Map();
for (const file of walk(PAGES_DIR)) {
  const parsed = parse(file);
  if (!parsed) continue;
  if (isUntranslated(file)) continue;
  if (!byRoute.has(parsed.route)) byRoute.set(parsed.route, new Set());
  byRoute.get(parsed.route).add(parsed.locale);
}

const url = (route, locale) => {
  const { prefix } = LOCALES[locale];
  if (route === '/') return `${SITE}${prefix || '/'}`;
  return `${SITE}${prefix}${route}`;
};

const entries = [];
for (const [route, locales] of [...byRoute].sort()) {
  // Alternates only point at locales that actually have the translation.
  const alternates = [...locales]
    .sort()
    .map(
      loc =>
        `    <xhtml:link rel="alternate" hreflang="${LOCALES[loc].hreflang}" href="${url(route, loc)}"/>`
    );
  if (locales.has(DEFAULT_LOCALE)) {
    alternates.push(
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${url(route, DEFAULT_LOCALE)}"/>`
    );
  }

  for (const locale of [...locales].sort()) {
    entries.push(
      [
        '  <url>',
        `    <loc>${url(route, locale)}</loc>`,
        ...alternates,
        `    <changefreq>weekly</changefreq>`,
        `    <priority>${route === '/' ? '1.0' : '0.7'}</priority>`,
        '  </url>',
      ].join('\n')
    );
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;

const robots = `# https://devops-journey.uz
User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${SITE}/sitemap.xml
`;

mkdirSync('public', { recursive: true });
writeFileSync('public/sitemap.xml', sitemap);
writeFileSync('public/robots.txt', robots);

console.log(
  `[sitemap] ${entries.length} ta URL yozildi (${byRoute.size} ta route), stublar chiqarib tashlandi`
);
