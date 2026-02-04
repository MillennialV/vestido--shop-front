import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_INVENTARIO_BASE_URL || 'http://localhost:3001';
        const res = await fetch(`${BACKEND_URL}/api/producto/detalle-producto/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        return NextResponse.json(data?.data || {});
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
}
