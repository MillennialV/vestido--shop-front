import { NextRequest, NextResponse } from 'next/server';
import { getDomain } from '@/lib/get-domain';

const BLOG_BASE_API = process.env.NEXT_PUBLIC_API_BLOG_BASE_URL || 'http://localhost:3000';

export async function GET() {
    try {
        const domain = await getDomain();
        const res = await fetch(`${BLOG_BASE_API}/api/blog/categories?domain=${domain}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
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