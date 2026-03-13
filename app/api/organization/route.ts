import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    try {
        const { organization_name, organization_display_name, domain } = await req.json();

        if (!organization_name || !organization_display_name) {
            return NextResponse.json(
                { error: "Nombre y Display Name son requeridos" },
                { status: 400 }
            );
        }

        const cookieStore = await cookies();
        const token = cookieStore.get("authToken")?.value;

        if (!token) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const orgUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL + "/api/organizations";

        const backendRes = await fetch(orgUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                organizationName: organization_name,
                organizationDisplayName: organization_display_name,
                domain: domain || undefined,
            }),
        });

        const text = await backendRes.text();
        let data = {};
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Error parsing backend response", text);
        }

        if (!backendRes.ok) {
            return NextResponse.json(
                { error: (data as any).message || "Error al crear la organización" },
                { status: backendRes.status }
            );
        }

        // Retorna la organizacion del backend
        return NextResponse.json(data);
    } catch (err) {
        console.error("Error en organization API route:", err);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
