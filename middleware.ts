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

export function middleware(request: NextRequest) {
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
