import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || 'localhost:3000';
  let domain = host.split(':')[0];

  // Evitar bucles y permitir rutas estáticas/api
  if (
    // pathname.startsWith('/onboarding') ||
    // pathname.startsWith('/panel') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.') || // archivos estáticos (favicon, etc)
    pathname.startsWith('/api')
  ) {
    const response = NextResponse.next();
    response.headers.set("x-ms-domain", host);
    return response;
  }

  const THEME_API_URL = process.env.NEXT_PUBLIC_THEME_SERVICE_URL || 'http://localhost:3008';
  const DEFAULT_DOMAIN = process.env.NEXT_PUBLIC_DEFAULT_DOMAIN || 'www.vestido.shop';

  if (domain === 'localhost' || domain === '127.0.0.1' || domain.includes('.local')) {
    domain = DEFAULT_DOMAIN;
  }

  try {
    // Verificamos si la tienda tiene información configurada
    let res = await fetch(`${THEME_API_URL}/api/store-info?domain=${domain}`);

    let data = res.ok ? await res.json() : null;
    const cleanDomain = domain.replace(/^www\./, '');

    // Si falla o no hay data, y el dominio tiene www, intentar con el dominio limpio
    if ((!res.ok || !data || !data.success || !data.data) && domain !== cleanDomain) {
      const fallbackRes = await fetch(`${THEME_API_URL}/api/store-info?domain=${cleanDomain}`);
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        if (fallbackData && fallbackData.success && fallbackData.data) {
          res = fallbackRes;
          data = fallbackData;
        }
      }
    }

    // if (!res.ok || !data || !data.success || !data.data) {
    //   return NextResponse.redirect(new URL('/onboarding', request.url));
    // }
  } catch (error) {
    console.error('Proxy check failed:', error);
    // En caso de error crítico, podríamos decidir si permitir o redirigir.
    // Redirigimos por seguridad de que la tienda debe estar configurada.
    // return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  const response = NextResponse.next();
  response.headers.set("x-ms-domain", host);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

