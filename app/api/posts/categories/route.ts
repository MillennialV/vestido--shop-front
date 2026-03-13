import { NextRequest, NextResponse } from 'next/server';
import { getDomain } from '@/lib/get-domain';

const BLOG_BASE_API = process.env.NEXT_PUBLIC_API_BLOG_BASE_URL || 'http://localhost:3000';

const getAuthHeaders = (req: NextRequest, isJson: boolean = true) => {
    const token = req.cookies.get('authToken')?.value;
    return {
        ...(isJson ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? {
            Authorization: `Bearer ${token}`,
            Cookie: `authToken=${token}`
        } : {}),
    };
};

export async function GET(req: NextRequest) {
    try {
        const domain = await getDomain();
        const headers = getAuthHeaders(req);
        
        const url = `${BLOG_BASE_API}/api/blog/categories?domain=${domain}`;
        console.log('FETCHING CATEGORIES FROM:', url);
        
        const res = await fetch(url, {
            method: 'GET',
            headers: headers,
        });

        if (!res.ok) {
            return NextResponse.json([]);
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return NextResponse.json([]);
        }

        const json = await res.json();
        const categories = json.success ? json.data : [];

        return NextResponse.json(categories);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const domain = await getDomain();
        
        const res = await fetch(`${BLOG_BASE_API}/api/blog/categories`, {
            method: 'POST',
            headers: getAuthHeaders(req),
            body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al crear la categoría');

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

        const body = await req.json();
        const res = await fetch(`${BLOG_BASE_API}/api/blog/categories/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(req),
            body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al actualizar la categoría');

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

        const res = await fetch(`${BLOG_BASE_API}/api/blog/categories/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(req),
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'Error al eliminar la categoría');
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}