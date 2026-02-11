import { NextRequest, NextResponse } from 'next/server';

const BLOG_BASE_API = process.env.NEXT_PUBLIC_API_BLOG_BASE_URL || 'http://localhost:3005';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const authHeader = req.headers.get('authorization');

        const res = await fetch(`${BLOG_BASE_API}/api/generate-sas-token`, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader ? { 'Authorization': authHeader } : {})
            }
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error generating SAS token:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
