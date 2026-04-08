import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const THEME_API_URL = process.env.NEXT_PUBLIC_THEME_SERVICE_URL || 'http://localhost:3008';

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("authToken")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await req.json();
        const backendRes = await fetch(`${THEME_API_URL}/api/chatbot-questions`, {
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
        console.error("Error en POST /api/theme/chatbot-questions:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
