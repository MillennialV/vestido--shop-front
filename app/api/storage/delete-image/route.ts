import { NextRequest, NextResponse } from 'next/server';

const BLOG_BASE_API = process.env.NEXT_PUBLIC_API_BLOG_BASE_URL || 'http://localhost:3005';

export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const authHeader = req.headers.get('authorization');

        const res = await fetch(`${BLOG_BASE_API}/api/delete-image`, {
            method: 'DELETE',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader ? { 'Authorization': authHeader } : {})
            }
        });

        // Handle no content or other status codes
        if (res.status === 204) {
            return new Response(null, { status: 204 });
        }

        let data;
        try {
            data = await res.json();
        } catch (e) {
            data = {};
        }

        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error deleting image:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
