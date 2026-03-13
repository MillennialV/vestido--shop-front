import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDomain } from "@/lib/get-domain";

const THEME_API_URL = process.env.NEXT_PUBLIC_THEME_SERVICE_URL || 'http://localhost:3008';

export async function GET(req: NextRequest) {
    const orgId = req.headers.get("organization-id");
    const domain = await getDomain();

    try {
        const url = new URL(`${THEME_API_URL}/api/store-info`);
        const reqHeaders: Record<string, string> = {};

        if (orgId) {
            reqHeaders["organization-id"] = orgId;
        } else {
            url.searchParams.append("domain", domain);
        }

        const cookieStore = await cookies();
        const token = cookieStore.get("authToken")?.value;
        if (token) reqHeaders["Authorization"] = `Bearer ${token}`;

        let backendRes = await fetch(url.toString(), { headers: reqHeaders });

        // Si falla (404) y el dominio tiene www, intentar con el dominio limpio
        const cleanDomain = domain.replace(/^www\./, '');
        if (!backendRes.ok && backendRes.status === 404 && domain !== cleanDomain && !orgId) {
            console.log(`[api/theme/store-info] 404 with ${domain}, trying with ${cleanDomain}`);
            const fallbackUrl = new URL(url.toString());
            fallbackUrl.searchParams.set("domain", cleanDomain);
            backendRes = await fetch(fallbackUrl.toString(), { headers: reqHeaders });
        }

        if (!backendRes.ok) {
            const errorText = await backendRes.text();
            console.error("Backend Theme Store-Info GET Error:", { status: backendRes.status, body: errorText });
            throw new Error(`Backend error: ${backendRes.status}`);
        }

        const text = await backendRes.text();
        const data = text ? JSON.parse(text) : null;
        return NextResponse.json(data, { status: backendRes.status });
    } catch (err: any) {
        console.error("Error en GET /api/theme/store-info:", err);
        return NextResponse.json({ error: "Internal server error", details: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("authToken")?.value;
        if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const body = await req.json();
        const backendRes = await fetch(`${THEME_API_URL}/api/store-info`, {
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
        console.error("Error en POST /api/theme/store-info:", err);
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

        const backendRes = await fetch(`${THEME_API_URL}/api/store-info/${id}`, {
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
        console.error("Error en PUT /api/theme/store-info:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
