// eslint-disable-next-line import/no-unresolved
import { NextRequest, NextResponse } from 'next/server';
import { locales } from 'nextra/locales';

const redirects: Record<string, string> = {
  '/examples/react/ipfs-playback': '/examples/react/dstorage-playback',
  // Monitoring articles moved out of /tutorials/article; keep old URLs alive
  // for search results and external links (issues #56, #57).
  '/tutorials/article/elk-stack': '/guides/monitoring/elk-stack',
  '/tutorials/article/elk-setup': '/guides/monitoring/elk-setup',
  '/tutorials/article/apm-server-sozlash':
    '/guides/monitoring/apm-server-sozlash',
};

// Served straight from `public/`. Nextra's locale middleware only skips a fixed
// list of extensions, and `.txt` isn't one of them — without this it rewrites
// /robots.txt to /robots.txt.en-UZ and the crawler gets a 404.
const PUBLIC_FILES = new Set(['/robots.txt', '/sitemap.xml']);

export function middleware(request: NextRequest) {
  if (PUBLIC_FILES.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Handle redirect in `_middleware.ts` because of bug using `next.config.js`
  // https://github.com/shuding/nextra/issues/384
  if (request.nextUrl.pathname in redirects) {
    const url = request.nextUrl.clone();
    const pathname = redirects[request.nextUrl.pathname] ?? '/';
    url.pathname = pathname;
    return NextResponse.redirect(url);
  }

  return locales(request);
}
