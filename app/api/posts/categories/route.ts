import { NextRequest, NextResponse } from 'next/server';

const BLOG_BASE_API = process.env.NEXT_PUBLIC_API_BLOG_BASE_URL || 'http://localhost:3000';

export async function GET() {
    try {
        const res = await fetch(`${BLOG_BASE_API}/api/blog/categories`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        const json = await res.json();
        const categories = json.success ? json.data : [];

        return NextResponse.json(categories);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}