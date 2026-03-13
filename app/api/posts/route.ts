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


// GET /api/posts
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        const domain = await getDomain();
        const queryParams = new URLSearchParams({
            page: searchParams.get('page') || '1',
            limit: searchParams.get('limit') || '100',
            sort: searchParams.get('sort') || 'title',
            order: searchParams.get('order') || 'desc',
            domain: domain,
        });

        const headers = getAuthHeaders(req);

        const res = await fetch(`${BLOG_BASE_API}/api/blog/posts?${queryParams}`, {
            method: 'GET',
            headers: headers,
            cache: 'no-store',
        });

        if (!res.ok) {
            return NextResponse.json({ posts: [], pagination: null });
        }

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return NextResponse.json({ posts: [], pagination: null });
        }

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
        const contentType = req.headers.get('content-type') || '';
        const isFormData = contentType.includes('multipart/form-data');
        let options: RequestInit = { method: 'POST' };

        if (isFormData) {
            const formData = await req.formData();
            formData.delete('slug');
            formData.delete('seo_keywords');

            options.headers = getAuthHeaders(req, false);
            options.body = formData;
        } else {
            const body = await req.json();
            const { slug, seo_keywords, categoryId, ...bodyWithoutSlug } = body;

            options.headers = getAuthHeaders(req, true);
            options.body = JSON.stringify(bodyWithoutSlug);
        }

        const res = await fetch(`${BLOG_BASE_API}/api/blog/posts`, options);

        let data;
        const textResponse = await res.text();
        try {
            data = JSON.parse(textResponse);
        } catch (e) {
            console.error('No se pudo parsear como JSON:', textResponse);
            throw new Error(`Error en el backend: ${res.status}`);
        }

        if (res.ok === false || (data && data.success === false)) {
            console.error('Backend devolvió error:', data);
            throw new Error(data.message || data.error || 'Error al crear el post');
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

        const contentType = req.headers.get('content-type') || '';
        const isFormData = contentType.includes('multipart/form-data');
        let options: RequestInit = { method: 'PUT' };

        if (isFormData) {
            const formData = await req.formData();
            formData.delete('slug');
            formData.delete('seo_keywords');

            options.headers = getAuthHeaders(req, false);
            options.body = formData;
        } else {
            const body = await req.json();
            const { slug, seo_keywords, categoryId, ...bodyWithoutSlug } = body;

            options.headers = getAuthHeaders(req, true);
            options.body = JSON.stringify(bodyWithoutSlug);
        }

        const res = await fetch(`${BLOG_BASE_API}/api/blog/posts/${id}`, options);

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

        let bodyContents: string | undefined = undefined;
        try {
            const body = await req.json();
            bodyContents = JSON.stringify(body);
        } catch (e) { }

        const res = await fetch(`${BLOG_BASE_API}/api/blog/posts/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(req, true),
            body: bodyContents
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
