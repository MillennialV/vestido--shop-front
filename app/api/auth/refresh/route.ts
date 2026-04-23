import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;

  if (!token) {
    return NextResponse.json({ error: 'No hay token para refrescar' }, { status: 401 });
  }

  try {
    const refreshUrl = `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/tokens/refresh`;
    console.log('🔄 [Auth Refresh] Intentando refrescar token en:', refreshUrl);

    const backendRes = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      console.error('❌ [Auth Refresh] Error en el backend:', errorData);
      return NextResponse.json({ error: 'No se pudo refrescar el token' }, { status: backendRes.status });
    }

    const data = await backendRes.json();
    const newToken = data.data?.token;

    if (!newToken) {
      return NextResponse.json({ error: 'Respuesta de refresco inválida' }, { status: 500 });
    }

    // Obtener datos del usuario con el nuevo token
    const meRes = await fetch(`${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${newToken}` }
    });
    
    let userData = {};
    if (meRes.ok) {
      const meData = await meRes.json();
      userData = meData.data || {};
    }

    const response = NextResponse.json({
      success: true,
      token: newToken,
      user: (userData as any).user || userData,
      organization: (userData as any).organization || null
    });

    // Establecer la nueva cookie
    response.cookies.set('authToken', newToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60, // 1 minuto para pruebas
    });

    console.log('✅ [Auth Refresh] Token refrescado exitosamente');
    return response;

  } catch (error) {
    console.error('❌ [Auth Refresh] Error crítico:', error);
    return NextResponse.json({ error: 'Error interno al refrescar token' }, { status: 500 });
  }
}
