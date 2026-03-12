import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  try {
    const orgUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL + '/api/auth/me';
    const backendRes = await fetch(orgUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (backendRes.ok) {
      const data = await backendRes.json();
      let organization = data.data?.organization || null;

      if (token && !organization) {
        try {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          organization = payload.organization || null;
        } catch (e) {
          console.error('Error decoding token for organization in session:', e);
        }
      }

      return NextResponse.json({
        authenticated: true,
        token,
        user: data.data?.user || null,
        organization: organization
      });
    }
  } catch (error) {
    console.error('Error fetching user session info:', error);
  }

  return NextResponse.json({ authenticated: true, token, user: null, organization: null });
}
