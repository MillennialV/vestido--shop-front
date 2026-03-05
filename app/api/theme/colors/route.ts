import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const THEME_API_URL = process.env.NEXT_PUBLIC_THEME_SERVICE_URL || 'http://localhost:3008';

export async function GET(req: NextRequest) {
    const orgId = req.headers.get("organization-id");
    if (!orgId) {
        return NextResponse.json({ error: "organization-id header is required" }, { status: 400 });
    }

    try {
        const backendRes = await fetch(`${THEME_API_URL}/api/theme-colors`, {
            headers: { "organization-id": orgId }
        });

        // Manejar el caso donde no hay contenido (por ejemplo si es la primera vez)
        const text = await backendRes.text();
        const data = text ? JSON.parse(text) : null;

        return NextResponse.json(data, { status: backendRes.status });
    } catch (err) {
        console.error("Error en GET /api/theme/colors:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("authToken")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await req.json();
        const backendRes = await fetch(`${THEME_API_URL}/api/theme-colors`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (err) {
        console.error("Error en POST /api/theme/colors:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("authToken")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await req.json();
        const { id, ...rest } = body;

        if (!id) return NextResponse.json({ error: "Se requiere el ID en el body para actualizar" }, { status: 400 });

        const backendRes = await fetch(`${THEME_API_URL}/api/theme-colors/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(rest)
        });

        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (err) {
        console.error("Error en PUT /api/theme/colors:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
