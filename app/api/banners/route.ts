import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BANNER_API_URL = process.env.NEXT_PUBLIC_BANNER_SERVICE_URL || 'http://localhost:3009';

export async function GET(req: NextRequest) {
    const orgId = req.headers.get("organization-id");
    if (!orgId) {
        return NextResponse.json({ error: "organization-id header is required" }, { status: 400 });
    }

    try {
        const backendRes = await fetch(`${BANNER_API_URL}/api/banners`, {
            headers: { "organization-id": orgId }
        });

        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (err) {
        console.error("Error en GET /api/banners:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("authToken")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const formData = await req.formData();

        const backendRes = await fetch(`${BANNER_API_URL}/api/banners`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        const data = await backendRes.json();

        return NextResponse.json(data, { status: backendRes.status });
    } catch (err) {
        console.error("Error en POST /api/banners:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("authToken")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const formData = await req.formData();
        const id = formData.get("id") as string;

        if (!id) return NextResponse.json({ error: "Se requiere un campo 'id' en el FormData" }, { status: 400 });

        formData.delete("id");

        const backendRes = await fetch(`${BANNER_API_URL}/api/banners/${id}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (err) {
        console.error("Error en PUT /api/banners:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("authToken")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        const orgId = searchParams.get("organization_id");

        if (!id) return NextResponse.json({ error: "Se requiere el ID como search param '?id='" }, { status: 400 });

        const targetUrl = orgId
            ? `${BANNER_API_URL}/api/banners/${id}?organization_id=${orgId}`
            : `${BANNER_API_URL}/api/banners/${id}`;

        const backendRes = await fetch(targetUrl, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const text = await backendRes.text();
        const data = text ? JSON.parse(text) : null;

        return NextResponse.json(data, { status: backendRes.status });
    } catch (err) {
        console.error("Error en DELETE /api/banners:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
