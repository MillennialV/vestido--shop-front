import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  // Opcional: puedes decodificar el token o pedir el usuario al backend
  // Aquí solo devolvemos que está autenticado
  return NextResponse.json({ authenticated: true });
}
