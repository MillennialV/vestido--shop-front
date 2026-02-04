import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Borra la cookie authToken
  const response = NextResponse.json({ success: true });
  response.cookies.set('authToken', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
