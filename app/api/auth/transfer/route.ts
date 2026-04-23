import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  let target = searchParams.get('target') || '/';

  // Security: Prevent Open Redirect (only allow relative paths)
  if (target.startsWith('http') || target.startsWith('//')) {
    target = '/';
  }

  if (!token) {
    return NextResponse.redirect(new URL(target, req.url));
  }

  const response = NextResponse.redirect(new URL(target, req.url));

  response.cookies.set('authToken', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60, // 1 minuto para pruebas
  });

  return response;
}
