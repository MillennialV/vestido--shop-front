import { NextRequest, NextResponse } from 'next/server';

// POST /api/ia/image-to-image
// Esta ruta es la implementación genérica de image-to-image.
export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get('content-type') || '';

        let imageBase64 = '';
        let prompt = '';
        let model = 'gemini-2.5-flash-image';

        const token = req.cookies.get('authToken')?.value;

        if (contentType.includes('application/json')) {
            const body = await req.json();
            imageBase64 = body.imageBase64 || body.image;
            prompt = body.prompt;
        } else if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            imageBase64 = formData.get('imageBase64') as string || formData.get('image') as string;
            prompt = formData.get('prompt') as string;
        } else {
            return NextResponse.json({ message: 'Content-Type no soportado' }, { status: 400 });
        }

        if (!imageBase64) {
            return NextResponse.json({ message: 'Falta la imagen' }, { status: 400 });
        }

        if (!prompt) {
            return NextResponse.json({ message: 'Falta el prompt' }, { status: 400 });
        }

        const cleanBase64 = imageBase64.includes('base64,')
            ? imageBase64.split('base64,')[1]
            : imageBase64;

        const url = process.env.NEXT_PUBLIC_IA_URL || 'http://localhost:3004';

        const body = {
            imageBase64: cleanBase64,
            model: model,
            prompt: prompt
        };

        console.log(`[ImageToImage] Calling IA Microservice at: ${url}/api/ai/image-to-text-image`);

        const iaRes = await fetch(`${url}/api/ai/image-to-text-image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body)
        });

        if (!iaRes.ok) {
            const errorText = await iaRes.text();
            return NextResponse.json({
                message: 'Error en el microservicio de IA',
                details: errorText
            }, { status: iaRes.status });
        }

        const iaData = await iaRes.json();
        const result = iaData.data || {};

        return NextResponse.json({
            success: true,
            imageBase64: result.imageBase64 || null,
            generated_images: result.generated_images || [],
            generated_text: result.generated_text || '',
            usage: result.usage || null,
            model: result.model || model
        });

    } catch (error: any) {
        console.error("[IA API] General error in ImageToImage:", error);
        return NextResponse.json({
            message: 'Error interno o de conexión con IA',
            error: error.message
        }, { status: 500 });
    }
}
