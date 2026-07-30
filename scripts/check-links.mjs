// Verifies every internal link in the MDX content resolves to a page that
// exists. Two issues (#56, #57) sat open for months because articles were moved
// and the links pointing at them silently started returning 404 — this catches
// that class of breakage in CI instead of in a reader's browser.
//
//   node scripts/check-links.mjs

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

const PAGES_DIR = 'pages';
const LOCALES = ['en-UZ', 'en', 'ru'];
const SITE = 'https://devops-journey.uz';

// Links Next.js resolves outside the MDX tree.
const IGNORED_PREFIXES = ['/api/', '/_next/'];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(mdx|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

// Matches markdown links, JSX href props, and absolute links back to the site.
const LINK_RE = new RegExp(
  `\\]\\((/[^)\\s]*)\\)|href="(/[^"]*)"|${SITE.replace(/\./g, '\\.')}(/[^)"'\\s]*)`,
  'g'
);

function routeExists(rawPath) {
  const [withoutHash] = rawPath.split('#');
  const [pathname] = (withoutHash ?? '').split('?');
  let parts = (pathname ?? '').replace(/\/$/, '').split('/').filter(Boolean);
  if (parts[0] && LOCALES.includes(parts[0])) parts = parts.slice(1);
  if (parts.length === 0) return true; // home page

  const base = join(PAGES_DIR, ...parts);
  for (const locale of LOCALES) {
    if (existsSync(`${base}.${locale}.mdx`)) return true;
    if (existsSync(join(base, `index.${locale}.mdx`))) return true;
  }
  for (const ext of ['.mdx', '.tsx', '.ts', '.jsx', '.js']) {
    if (existsSync(base + ext)) return true;
  }
  return existsSync(base) && statSync(base).isDirectory();
}

const broken = new Map();
let checked = 0;

for (const file of walk(PAGES_DIR)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    for (const match of line.matchAll(LINK_RE)) {
      const link = match[1] || match[2] || match[3];
      if (!link) continue;
      if (IGNORED_PREFIXES.some(prefix => link.startsWith(prefix))) continue;
      checked++;
      if (routeExists(link)) continue;
      const key = link.split('#')[0] ?? link;
      if (!broken.has(key)) broken.set(key, []);
      broken.get(key).push(`${file.split(sep).join('/')}:${index + 1}`);
    }
  });
}

console.log(`Checked ${checked} internal links.`);

if (broken.size === 0) {
  console.log('No broken internal links.');
  process.exit(0);
}

console.error(`\n${broken.size} broken link target(s):\n`);
for (const [link, refs] of [...broken].sort()) {
  console.error(`  ${link}`);
  for (const ref of refs) console.error(`      ${ref}`);
}
process.exit(1);
