import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Match /cars/[slug] where slug is an individual listing (starts with 4-digit year, e.g. 2019-toyota-axio-dhaka-xk7p2)
  const carsMatch = pathname.match(/^\/cars\/(\d{4}-.*)$/);
  if (carsMatch) {
    const slug = carsMatch[1];
    // Rewrite internally to the separate detail route page to avoid Next.js App Router dynamic segment conflicts
    url.pathname = `/cars/detail/${slug}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/cars/:path*',
  ],
};
