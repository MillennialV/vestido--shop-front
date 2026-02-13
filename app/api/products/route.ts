
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_INVENTARIO_BASE_URL || 'http://localhost:3001';

function getAuthHeaders(request: NextRequest): Record<string, string> {
    const token = request.cookies.get('authToken')?.value;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const isRealFilter = (key: string) => {
            const value = searchParams.get(key);
            return value && value !== 'all' && value.trim() !== '';
        };

        const hasActiveFilters = isRealFilter('brand') || isRealFilter('size') || isRealFilter('color') || isRealFilter('q');

        let endpoint = hasActiveFilters ? '/api/producto/filtrar-busqueda' : '/api/producto/obtener-listado-productos';
        const backendUrl = new URL(`${BACKEND_URL}${endpoint}`);

        searchParams.forEach((value, key) => {
            if (value === 'all' || !value) return;

            if (key === 'q') {
                backendUrl.searchParams.append('personalizado', value);
            } else {
                backendUrl.searchParams.append(key, value);
            }
        });

        const headers = getAuthHeaders(request);
        const res = await fetch(backendUrl.toString(), {
            method: 'GET',
            headers: headers
        });
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();

        return NextResponse.json(data?.data || { products: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Error fetching products' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';
        const authHeaders = getAuthHeaders(request);
        let res: Response;

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();

            res = await fetch(`${BACKEND_URL}/api/producto/crear-producto`, {
                method: 'POST',
                headers: authHeaders,
                body: formData,
            });
        } else {
            const body = await request.json();
            res = await fetch(`${BACKEND_URL}/api/producto/crear-producto`, {
                method: 'POST',
                headers: {
                    ...authHeaders,
                    'Content-Type': 'application/json'
                },
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
        const authHeaders = getAuthHeaders(request);
        let res: Response;
        let productId: string | null = null;

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            productId = formData.get('id') as string;

            if (formData.has('id')) {
                formData.delete('id');
            }

            res = await fetch(`${BACKEND_URL}/api/producto/actualizar-producto/${productId}`, {
                method: 'PUT',
                headers: authHeaders,
                body: formData,
            });
        } else {
            const body = await request.json();
            const { id, ...updateData } = body;
            productId = id;

            res = await fetch(`${BACKEND_URL}/api/producto/actualizar-producto/${productId}`, {
                method: 'PUT',
                headers: {
                    ...authHeaders,
                    'Content-Type': 'application/json'
                },
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
        const authHeaders = getAuthHeaders(request);

        const res = await fetch(`${BACKEND_URL}/api/producto/eliminar-producto/${id}`, {
            method: 'DELETE',
            headers: authHeaders
        });
        if (!res.ok) throw new Error('Failed to delete product');
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting product' }, { status: 500 });
    }
}
