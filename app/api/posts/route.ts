import { NextRequest, NextResponse } from 'next/server';

const BLOG_BASE_API = process.env.NEXT_PUBLIC_API_BLOG_BASE_URL || 'http://localhost:3000';

// GET /api/posts
export async function GET(req: NextRequest) {
    try {
        const res = await fetch(`${BLOG_BASE_API}/api/blog/posts`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
            throw new Error('Error fetching posts');
        }
        const data = await res.json();
        return NextResponse.json(data.posts || []);
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json({ error: 'Error fetching posts' }, { status: 500 });
    }
}

// POST /api/posts
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const res = await fetch(`${BLOG_BASE_API}/api/blog/posts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            throw new Error('Error creating post');
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error creating post:', error);
        return NextResponse.json({ error: 'Error creating post' }, { status: 500 });
    }
}

// PUT /api/posts?id=123
export async function PUT(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        const body = await req.json();
        const res = await fetch(`${BLOG_BASE_API}/api/blog/posts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            throw new Error('Error updating post');
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error updating post:', error);
        return NextResponse.json({ error: 'Error updating post' }, { status: 500 });
    }
}

// DELETE /api/posts?id=123
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        const res = await fetch(`${BLOG_BASE_API}/api/blog/posts/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
            throw new Error('Error deleting post');
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting post:', error);
        return NextResponse.json({ error: 'Error deleting post' }, { status: 500 });
    }
}
