import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Intentamos obtener el origen de la petición para que la redirección sea dinámica
    const origin = req.nextUrl.origin;
    console.log('🔍 [Google Auth] Generando URL para frontend:', origin);
    
    // Pasamos el frontend_url para que el backend sepa a dónde redirigir el callback
    const url = `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/auth/google/url?frontend_url=${encodeURIComponent(origin)}`;
    
    const backendRes = await fetch(url, { method: 'GET' });
    const text = await backendRes.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch (e) { }

    if (!backendRes.ok || !(data as any).data?.authUrl) {
      console.error('❌ [Google Auth] Error obteniendo URL del backend:', data);
      return NextResponse.redirect(new URL(`/?error=GoogleAuthUrlError&msg=${encodeURIComponent((data as any).error || 'Backend Error')}`, origin));
    }

    const authUrl = (data as any).data.authUrl;
    console.log('🚀 [Google Auth] Redirigiendo a Google:', authUrl);

    // Redirect user to the Google Consent screen
    return NextResponse.redirect(authUrl);
  } catch (err) {
    console.log('Error getting google auth url:', err);
    const origin = req.nextUrl.origin;
    return NextResponse.redirect(new URL('/?error=GoogleAuthUrlError', origin));
  }
}

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Falta el token de sesión' }, { status: 400 });
    }

    const sessionUrl = `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/auth/me`;
    console.log('🔍 [Next.js Proxy] Validando sesión en:', sessionUrl);

    const sessionRes = await fetch(sessionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const sessionText = await sessionRes.text();
    let sessionData = {};
    try {
      sessionData = JSON.parse(sessionText);
    } catch (e) {
      console.error('Error parsing session response:', e);
    }

    if (!sessionRes.ok) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Extraer datos del usuario y organización
    const user = (sessionData as any).data?.user || (sessionData as any).data;
    let organization = (sessionData as any).data?.organization || null;

    // Normalizar usuario
    const normalizedUser = user ? { ...user, id: user.userId || user.user_id || user.id } : null;

    // Si tiene organización, intentamos obtener los datos completos
    if (organization?.id) {
      try {
        const orgUrl = `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/organizations/${organization.id}`;
        const orgRes = await fetch(orgUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          const fullOrg = orgData?.data || orgData;
          organization = { ...organization, ...fullOrg };
        }
      } catch (e) {
        console.log('Could not fetch full org data on google login:', e);
      }
    }

    const response = NextResponse.json({
      success: true,
      user: normalizedUser,
      organization: organization,
      token: token
    });

    // IMPORTANTE: El maxAge debe ser consistente con lo que el usuario pidió (aunque aquí está 7 días)
    // Pero recordamos que bajamos el maxAge a 60s para pruebas en otros archivos.
    // Aquí lo dejaremos en 7 días o lo que sea estándar, a menos que el usuario diga lo contrario.
    response.cookies.set('authToken', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;

  } catch (err) {
    console.log('Error in google proxy route (POST):', err);
    return NextResponse.json({ error: 'Error al establecer la sesión de Google' }, { status: 500 });
  }
}
