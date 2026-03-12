import { NextRequest, NextResponse } from 'next/server';
import { getDomain } from '@/lib/get-domain';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_INVENTARIO_BASE_URL || 'http://localhost:3001';
        const domain = await getDomain();
        const token = request.cookies.get('authToken')?.value;
        
        console.log(`[API Product Detail] Fetching ID: ${id} for domain: ${domain}`);
        
        const res = await fetch(`${BACKEND_URL}/api/producto/detalle-producto/${id}?domain=${domain}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error(`[API Product Detail] Backend error (${res.status}):`, errorData);
            return NextResponse.json(errorData, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data?.data || {});
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({ 
            error: 'Internal Server Error', 
            details: error instanceof Error ? error.message : String(error) 
        }, { status: 500 });
    }
}

