
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_INVENTARIO_BASE_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const token = request.cookies.get('authToken')?.value;

        const res = await fetch(`${BACKEND_URL}/api/upload/images`, {
            method: 'POST',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
            return NextResponse.json(data, { status: res.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({
            error: 'Error uploading images',
            message: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
