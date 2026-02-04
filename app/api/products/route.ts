
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_INVENTARIO_BASE_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
    try {
        // Pasar parámetros de paginación, búsqueda, etc. si existen
        const { searchParams } = new URL(request.url);
        const page = searchParams.get('page') || '1';
        const limit = searchParams.get('limit') || '100';
        const sort = searchParams.get('sort') || 'title';
        const order = searchParams.get('order') || 'desc';
        const url = `${BACKEND_URL}/api/producto/obtener-listado-productos?page=${page}&limit=${limit}&sort=${sort}&order=${order}`;
        const res = await fetch(url, { method: 'GET' });
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        return NextResponse.json(data?.data?.products || []);
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Error fetching products' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const res = await fetch(`${BACKEND_URL}/api/producto/crear-producto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to create product');
        const data = await res.json();
        return NextResponse.json(data?.data || {});
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Error creating product' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, ...updateData } = body;
        const res = await fetch(`${BACKEND_URL}/api/producto/actualizar-producto/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
        });
        if (!res.ok) throw new Error('Failed to update product');
        const data = await res.json();
        return NextResponse.json(data?.data || {});
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'Error updating product' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { id } = await request.json();
        const res = await fetch(`${BACKEND_URL}/api/producto/eliminar-producto/${id}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete product');
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: 'Error deleting product' }, { status: 500 });
    }
}
