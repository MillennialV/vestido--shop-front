import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const url = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL + '/api/auth/email';

    const backendRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const text = await backendRes.text();

    let data = {};
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.log('Error parsing backend response as JSON:', e);
    }
    if (!backendRes.ok || !(data as any).data?.token) {
      return NextResponse.json({ error: (data as any).error || 'Credenciales inválidas' }, { status: 401 });
    }

    const token = (data as any).data?.token;
    let organization = (data as any).data?.organization;

    console.log('[Login API Route] Backend response organization:', organization);

    if (token && !organization) {
      try {
        const payloadStr = Buffer.from(token.split('.')[1], 'base64').toString();
        const payload = JSON.parse(payloadStr);
        console.log('[Login API Route] Decoded token payload:', JSON.stringify(payload));

        organization = payload.organization || (payload.organizationId ? { id: payload.organizationId } : null);
        console.log('[Login API Route] Organization after decoding fallback:', organization);
      } catch (e) {
        console.error('Error decoding token for organization:', e);
      }
    }

    const response = NextResponse.json({
      success: true,
      user: (data as any).data?.user,
      organization: organization,
      token: token
    });
    response.cookies.set('authToken', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;

  } catch (err) {
    console.log('Error in login route:', err);
    return NextResponse.json({ error: 'Error en el login' }, { status: 500 });
  }
}
