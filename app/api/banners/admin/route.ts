import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BANNER_API_URL = process.env.NEXT_PUBLIC_BANNER_SERVICE_URL || 'http://localhost:3009';

export async function GET(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("authToken")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const backendRes = await fetch(`${BANNER_API_URL}/api/banners/admin`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (err) {
        console.error("Error en GET /api/banners/admin:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
