import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/ia/count-tokens
 * Endpoint para contar tokens antes de realizar una petición a la IA.
 * Sirve para estimar el costo de la operación.
 */
export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('content-type') || '';
        let body: any = {};

        // Obtener el token de las cookies para pasarlo al microservicio
        const token = req.cookies.get('authToken')?.value;

        if (contentType.includes('application/json')) {
            body = await req.json();
        } else if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            body.prompt = formData.get('prompt') as string;
            body.imageUrl = formData.get('imageUrl') as string;
            body.imageBase64 = formData.get('imageBase64') as string;
            body.model = formData.get('model') as string;
        } else {
            return NextResponse.json({ message: 'Content-Type no soportado' }, { status: 400 });
        }

        const prompt = body.prompt || body.text;
        const imageUrl = body.imageUrl;
        const imageBase64 = body.imageBase64 || body.image;
        const model = body.model;

        // El microservicio de IA se encuentra en esta URL
        const url = process.env.NEXT_PUBLIC_IA_URL || 'http://localhost:3004';

        // Preparar el cuerpo para el microservicio
        const proxyBody: any = {
            prompt,
            model: model || 'gemini-1.5-flash',
        };

        if (imageUrl) proxyBody.imageUrl = imageUrl;
        if (imageBase64) {
            proxyBody.imageBase64 = imageBase64.includes('base64,')
                ? imageBase64.split('base64,')[1]
                : imageBase64;
        }

        console.log(`[CountTokens] Calling IA Microservice at: ${url}/api/ai/count-tokens`);

        const iaRes = await fetch(`${url}/api/ai/count-tokens`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(proxyBody)
        });

        if (!iaRes.ok) {
            const errorText = await iaRes.text();
            console.error(`[IA API] Error response from microservice: ${iaRes.status}`, errorText);
            return NextResponse.json({
                message: 'El microservicio de IA respondió con un error',
                status: iaRes.status,
                details: errorText
            }, { status: iaRes.status });
        }

        const iaData = await iaRes.json();
        console.log("[IA API] Success response received from count-tokens");

        return NextResponse.json(iaData);

    } catch (error: any) {
        console.error("[IA API] General error in CountTokens:", error);
        return NextResponse.json({
            message: 'No se pudo conectar con el servicio de IA o ocurrió un error interno.',
            error: error.message
        }, { status: 500 });
    }
}
