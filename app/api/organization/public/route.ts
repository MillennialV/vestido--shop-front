import { NextRequest, NextResponse } from "next/server";
import { getDomain } from "@/lib/get-domain";

const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'https://auth.vestido.shop';

export async function GET(req: NextRequest) {
    try {
        const domain = await getDomain();
        const cleanDomain = domain.replace(/^www\./, '');
        
        // Intentar primero con el dominio tal cual (manteniendo www si lo tiene)
        let url = `${AUTH_SERVICE_URL}/api/organizations/domain/${domain}`;
        let backendRes = await fetch(url, { cache: 'no-store' });

        // Si falla (404) y el dominio tiene www, intentar con el dominio limpio
        if (!backendRes.ok && backendRes.status === 404 && domain !== cleanDomain) {
            console.log(`[api/organization/public] 404 with ${domain}, trying with ${cleanDomain}`);
            url = `${AUTH_SERVICE_URL}/api/organizations/domain/${cleanDomain}`;
            backendRes = await fetch(url, { cache: 'no-store' });
        }

        if (!backendRes.ok) {
            const errorText = await backendRes.text();
            console.error("Backend Auth Public Org GET Error:", { status: backendRes.status, body: errorText });
            
            try {
                // Intentar parsear como JSON para devolver el error exacto del backend
                const errorData = JSON.parse(errorText);
                return NextResponse.json(errorData, { status: backendRes.status });
            } catch {
                // Si no es JSON, devolver el texto plano o un error genérico con el mensaje
                return NextResponse.json(
                    { error: errorText || "Error fetching organization info" }, 
                    { status: backendRes.status }
                );
            }
        }

        const data = await backendRes.json();
        return NextResponse.json(data);
    } catch (err: any) {
        console.error("Error en GET /api/organization/public:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
