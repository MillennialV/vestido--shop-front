
import { NextRequest, NextResponse } from 'next/server';
import { getDomain } from '@/lib/get-domain';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_INVENTARIO_BASE_URL || 'http://localhost:3001';

function getAuthHeaders(request: NextRequest): Record<string, string> {
    const token = request.cookies.get('authToken')?.value;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * GET: Obtener configuración de filtros
 */
export async function GET(request: NextRequest) {
    try {
        const domain = await getDomain();
        const res = await fetch(`${BACKEND_URL}/api/producto/config-filtros?domain=${domain}`, {
            method: 'GET',
            headers: getAuthHeaders(request),
            cache: 'no-store'
        });

        if (!res.ok) {
            return NextResponse.json({ campos_activos: ['brand'] });
        }

        const data = await res.json();
        return NextResponse.json(data?.data || { campos_activos: ['brand'] });
    } catch (error) {
        console.error('Error fetching filter config:', error);
        return NextResponse.json({ campos_activos: ['brand'] });
    }
}

/**
 * POST: Actualizar configuración de filtros (Solo Admin)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const domain = await getDomain();
        
        const res = await fetch(`${BACKEND_URL}/api/producto/config-filtros?domain=${domain}`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(request),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error updating filter config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
