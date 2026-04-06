import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const THEME_API_URL = process.env.NEXT_PUBLIC_THEME_SERVICE_URL || 'http://localhost:3008';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const { id } = await params;
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("authToken")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const contentType = req.headers.get("content-type");
        let backendRes;

        if (contentType?.includes("multipart/form-data")) {
            const formData = await req.formData();
            backendRes = await fetch(`${THEME_API_URL}/api/store-metadata/${id}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });
        } else {
            const body = await req.json();
            backendRes = await fetch(`${THEME_API_URL}/api/store-metadata/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });
        }

        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (err: any) {
        console.error(`Error en PUT /api/theme/metadata/${id}:`, err);
        return NextResponse.json({ error: "Internal server error", details: err.message }, { status: 500 });
    }
}
