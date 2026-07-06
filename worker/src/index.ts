export interface Env {
  DOMAIN_CACHE: KVNamespace; // Cloudflare KV: custom_domain → { dealership_id, slug, status }
  DB_LOOKUP_URL: string; // API endpoint for cache misses
  DB_LOOKUP_SECRET: string; // Shared secret for internal API calls
  VERCEL_APP_URL: string; // e.g., https://dealer.garisale.com
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const host = request.headers.get('Host') || '';
    const pathname = url.pathname;

    // 0. Exclude system subdomains from routing logic by fetching targets directly
    if (host === 'api.garisale.com') {
      const target = new URL(request.url);
      target.hostname = 'api-production-a231.up.railway.app';
      target.port = '';
      return fetch(new Request(target.toString(), request));
    }

    if (host === 'staging.api.garisale.com') {
      const target = new URL(request.url);
      target.hostname = 'api-production-2479.up.railway.app';
      target.port = '';
      return fetch(new Request(target.toString(), request));
    }

    if (host === 'admin.garisale.com' || host === 'www.garisale.com') {
      return fetch(request);
    }

    // 1. Determine if this is a custom domain or subdomain request
    const isSubdomain = host.endsWith('.garisale.com');
    const isCustomDomain = !isSubdomain && host !== 'garisale.com';

    if (!isCustomDomain && !isSubdomain) {
      // Pass through to marketplace (main domain)
      return fetch(request);
    }

    // 2. For subdomains: extract slug from host
    let dealerSlug: string | null = null;
    let dealershipId: string | null = null;

    if (isSubdomain) {
      // host = "dhaka-auto.garisale.com" → slug = "dhaka-auto"
      dealerSlug = host.replace('.garisale.com', '').split('.')[0];
    }

    if (isCustomDomain) {
      // 3. Look up custom domain in Cloudflare KV (fast — < 1ms)
      const cached = await env.DOMAIN_CACHE.get(host);
      if (cached) {
        const data = JSON.parse(cached) as DomainRecord;
        dealerSlug = data.slug;
        dealershipId = data.dealership_id;

        // Handle suspended dealer
        if (data.status === 'suspended' || data.status === 'terminated') {
          return new Response(MAINTENANCE_HTML, {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }
      } else {
        // KV miss: call internal API to look up domain
        const lookupResult = await lookupDomain(host, env);
        if (!lookupResult) {
          return new Response('404 — Domain not found', { status: 404 });
        }

        // Cache result in KV (TTL: 5 minutes)
        await env.DOMAIN_CACHE.put(host, JSON.stringify(lookupResult), {
          expirationTtl: 300,
        });

        dealerSlug = lookupResult.slug;
        dealershipId = lookupResult.dealership_id;

        if (lookupResult.status === 'suspended' || lookupResult.status === 'terminated') {
          return new Response(MAINTENANCE_HTML, {
            status: 503,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }
      }
    }

    if (!dealerSlug) {
      return new Response('404 — Not found', { status: 404 });
    }

    // 4. Build target URL
    // Rewrite cars.dhaka-auto.com/cars/2019-toyota-axio
    // → dealer.garisale.com/dhaka-auto/cars/2019-toyota-axio
    const targetUrl = new URL(
      `${env.VERCEL_APP_URL}/${dealerSlug}${pathname}${url.search}`
    );

    // 5. Forward request with dealer context headers
    const modifiedRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: new Headers({
        ...Object.fromEntries(request.headers),
        'X-Dealership-ID': dealershipId || '',
        'X-Dealer-Slug': dealerSlug,
        'X-Original-Host': host,
        'X-Forwarded-Host': host, // for canonical URL generation in Next.js
      }),
      body: request.body,
      redirect: 'manual',
    });

    const response = await fetch(modifiedRequest);

    // 6. Fix response headers (ensure CORS and canonical headers are correct)
    const modifiedResponse = new Response(response.body, response);
    modifiedResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
    modifiedResponse.headers.set('X-Content-Type-Options', 'nosniff');

    return modifiedResponse;
  }
};

async function lookupDomain(host: string, env: Env): Promise<DomainRecord | null> {
  const response = await fetch(
    `${env.DB_LOOKUP_URL}/api/v1/internal/domain-lookup?host=${encodeURIComponent(host)}`,
    {
      headers: {
        'X-Internal-Secret': env.DB_LOOKUP_SECRET,
        'Content-Type': 'application/json',
      },
      cf: { cacheTtl: 300 }, // Cloudflare caches this response too
    }
  );
  if (!response.ok) return null;
  return response.json();
}

const MAINTENANCE_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Temporarily Unavailable</title></head>
<body style="font-family:sans-serif;text-align:center;padding:60px">
  <h1>Site Temporarily Unavailable</h1>
  <p>This dealership's website is temporarily offline. Please check back later.</p>
  <p>Find other dealers on <a href="https://garisale.com">Garisale Marketplace</a></p>
</body></html>`;

interface DomainRecord {
  dealership_id: string;
  slug: string;
  status: 'active' | 'suspended' | 'terminated';
}
