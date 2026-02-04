import { type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Puedes agregar lógica de autenticación, logging, etc.
  return;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
