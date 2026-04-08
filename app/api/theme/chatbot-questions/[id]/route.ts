import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const THEME_API_URL = process.env.NEXT_PUBLIC_THEME_SERVICE_URL || 'http://localhost:3008';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("authToken")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await req.json();
        const resolvedParams = await params;
        const id = resolvedParams.id;
        
        const backendRes = await fetch(`${THEME_API_URL}/api/chatbot-questions/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });

        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (err) {
        console.error("Error en PUT /api/theme/chatbot-questions/[id]:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("authToken")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        
        const resolvedParams = await params;
        const id = resolvedParams.id;

        const backendRes = await fetch(`${THEME_API_URL}/api/chatbot-questions/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (err) {
        console.error("Error en DELETE /api/theme/chatbot-questions/[id]:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
