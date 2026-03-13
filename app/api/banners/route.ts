import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDomain } from "@/lib/get-domain";

const BANNER_API_URL = process.env.NEXT_PUBLIC_BANNER_SERVICE_URL || 'http://localhost:3009';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const domain = await getDomain();
    
    // Si viene un organization-id en los headers o query, lo usamos
    const orgId = req.headers.get("organization-id") || searchParams.get("organization-id");

    try {
        const url = new URL(`${BANNER_API_URL}/api/banners`);
        const reqHeaders: Record<string, string> = {};

        if (orgId) {
            reqHeaders["organization-id"] = orgId;
        } else {
            url.searchParams.append("domain", domain);
        }

        // Copiar otros parámetros de búsqueda (excepto domain y organization-id si ya se manejaron)
        searchParams.forEach((value, key) => {
            if (key !== "domain" && key !== "organization-id") {
                url.searchParams.append(key, value);
            }
        });

        const cookieStore = await cookies();
        const token = cookieStore.get("authToken")?.value;
        if (token) reqHeaders["Authorization"] = `Bearer ${token}`;


        let backendRes = await fetch(url.toString(), { headers: reqHeaders });

        // Si falla (404) y el dominio tiene www, intentar con el dominio limpio
        const cleanDomain = domain.replace(/^www\./, '');
        if (!backendRes.ok && backendRes.status === 404 && domain !== cleanDomain && !orgId) {
            console.log(`[api/banners] 404 with ${domain}, trying with ${cleanDomain}`);
            const fallbackUrl = new URL(url.toString());
            fallbackUrl.searchParams.set("domain", cleanDomain);
            backendRes = await fetch(fallbackUrl.toString(), { headers: reqHeaders });
        }

        if (!backendRes.ok) {
            const errorData = await backendRes.text();
            console.error("Backend Banners GET Error:", { status: backendRes.status, body: errorData });
            throw new Error(`Backend responded with ${backendRes.status}`);
        }

        const data = await backendRes.json();
        return NextResponse.json(data, { status: backendRes.status });
    } catch (err: any) {
        console.error("Error en GET /api/banners:", err);
        return NextResponse.json({ error: "Internal server error", details: err.message }, { status: 500 });
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

        if (!id) return NextResponse.json({ error: "Se requiere el ID como search param '?id='" }, { status: 400 });

        const targetUrl = `${BANNER_API_URL}/api/banners/${id}`;

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
