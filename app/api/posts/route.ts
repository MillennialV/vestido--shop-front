import { NextRequest, NextResponse } from 'next/server';

const BLOG_BASE_API = process.env.NEXT_PUBLIC_API_BLOG_BASE_URL || 'http://localhost:3000';

const getAuthHeaders = (req: NextRequest) => {
    const token = req.cookies.get('authToken')?.value;
    console.log('Token from cookies:', token ? 'FOUND' : 'MISSING', token || '');
    return {
        'Content-Type': 'application/json',
        ...(token ? {
            Authorization: `Bearer ${token}`,
            Cookie: `authToken=${token}`
        } : {}),
    };
};


// GET /api/posts
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const queryParams = new URLSearchParams({
            page: searchParams.get('page') || '1',
            limit: searchParams.get('limit') || '100',
            sort: searchParams.get('sort') || 'title',
            order: searchParams.get('order') || 'desc',
        });

        const headers = getAuthHeaders(req);
        console.log('GET /api/posts Headers:', headers);

        const res = await fetch(`${BLOG_BASE_API}/api/blog/posts?${queryParams}`, {
            method: 'GET',
            headers: headers,
            cache: 'no-store',
        });

        if (!res.ok) throw new Error('Error al obtener los posts desde el servidor');

        const result = await res.json();

        const postsContent = result.data?.posts || [];
        const paginationContent = result.data?.pagination || null;

        return NextResponse.json({
            posts: postsContent || [],
            pagination: paginationContent || null
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ error: 'Error fetching posts' }, { status: 500 });
    }
}

// POST /api/posts
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const { slug, seo_keywords, categoryId, ...bodyWithoutSlug } = body;

        const res = await fetch(`${BLOG_BASE_API}/api/blog/posts`, {
            method: 'POST',
            headers: getAuthHeaders(req),
            body: JSON.stringify(bodyWithoutSlug),
        });

        const data = await res.json();

        if (!data.success) {
            throw new Error(data.message || 'Error al crear el post');
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('POST Post Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/posts?id=123
export async function PUT(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

        const body = await req.json();

        const { slug, seo_keywords, categoryId, ...bodyWithoutSlug } = body;

        const res = await fetch(`${BLOG_BASE_API}/api/blog/posts/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(req),
            body: JSON.stringify(bodyWithoutSlug),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al actualizar el post');

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('PUT Post Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/posts?id=123
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

        const res = await fetch(`${BLOG_BASE_API}/api/blog/posts/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(req),
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'Error al eliminar el post');
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('DELETE Post Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
