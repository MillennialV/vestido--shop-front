
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_INVENTARIO_BASE_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
    try {
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
        const contentType = request.headers.get('content-type') || '';
        let res: Response;

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();

            res = await fetch(`${BACKEND_URL}/api/producto/crear-producto`, {
                method: 'POST',
                body: formData,
            });
        } else {
            const body = await request.json();
            res = await fetch(`${BACKEND_URL}/api/producto/crear-producto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        }

        const data = await res.json();

        if (!res.ok) {
            console.error('Backend Error:', data);
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data?.data || data);
    } catch (error) {
        return NextResponse.json({
            error: 'Error creating product',
            message: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';
        let res: Response;
        let productId: string | null = null;

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            productId = formData.get('id') as string;

            res = await fetch(`${BACKEND_URL}/api/producto/actualizar-producto/${productId}`, {
                method: 'PUT',
                body: formData,
            });
        } else {
            const body = await request.json();
            const { id, ...updateData } = body;
            productId = id;

            res = await fetch(`${BACKEND_URL}/api/producto/actualizar-producto/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData),
            });
        }

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data?.data || data);
    } catch (error) {
        return NextResponse.json({
            error: 'Error updating product',
            message: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
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
        return NextResponse.json({ error: 'Error deleting product' }, { status: 500 });
    }
}
