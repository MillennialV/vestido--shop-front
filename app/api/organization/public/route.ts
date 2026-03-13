import { NextRequest, NextResponse } from "next/server";
import { getDomain } from "@/lib/get-domain";

const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'https://auth.vestido.shop';

export async function GET(req: NextRequest) {
    const domain = await getDomain();

    try {
        // La ruta correcta para obtener una organización por dominio sin token es:
        // /api/organizations/domain/:domain
        const url = `${AUTH_SERVICE_URL}/api/organizations/domain/${domain}`;

        const backendRes = await fetch(url, {
            cache: 'no-store'
        });

        if (!backendRes.ok) {
            const errorText = await backendRes.text();
            console.error("Backend Auth Public Org GET Error:", { status: backendRes.status, body: errorText });
            return NextResponse.json({ error: "Error fetching organization info" }, { status: backendRes.status });
        }

        const data = await backendRes.json();
        return NextResponse.json(data);
    } catch (err: any) {
        console.error("Error en GET /api/organization/public:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
