import { NextRequest, NextResponse } from 'next/server';

// POST /api/ia/analyze-garment
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const model = 'gemini-2.5-flash-image';

    let promptFromClient = '';
    let imageBase64 = '';
    let maxLength: string | undefined = undefined;

    // Obtener el token de las cookies para pasarlo al microservicio si es necesario
    const token = req.cookies.get('authToken')?.value;

    // Permitir tanto JSON como form-data
    if (contentType.includes('application/json')) {
      const body = await req.json();
      imageBase64 = body.imageBase64;
      promptFromClient = body.prompt;
      const imageUrlInput = body.imageUrl;
      maxLength = body.maxLength;

      if (imageUrlInput && !imageBase64) {
        return handleExternalImage(imageUrlInput, model, maxLength, token);
      }
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      imageBase64 = formData.get('imageBase64') as string;
      promptFromClient = formData.get('prompt') as string;
      const maxLengthValue = formData.get('maxLength');
      maxLength = typeof maxLengthValue === 'string' ? maxLengthValue : undefined;
    } else {
      return NextResponse.json({ message: 'Content-Type no soportado' }, { status: 400 });
    }

    if (!imageBase64) {
      return NextResponse.json({ message: 'Falta imageBase64' }, { status: 400 });
    }

    const cleanBase64 = imageBase64.includes('base64,')
      ? imageBase64.split('base64,')[1]
      : imageBase64;

    const url = process.env.NEXT_PUBLIC_IA_URL || 'http://localhost:3004';
    const defaultPrompt = `Analiza el vestido en esta imagen. Responde SOLO con JSON válido en español.\n\nJSON requerido:\n{\n  "title": "nombre creativo del vestido",\n  "brand": "Sin marca",\n  "color": "color principal",\n  "size": "M",\n  "description": "breve descripción",\n  "price": 0,\n  "material": "No identificable",\n  "occasion": "Boda",\n  "style_notes": "detalles"\n}`;

    const body: any = {
      imageBase64: cleanBase64,
      model: model,
      maxLength: maxLength ? Number(maxLength) : 200,
      prompt: promptFromClient || defaultPrompt
    };

    console.log(`[AnalyzeGarment] Calling IA Microservice at: ${url}/api/ai/image-to-text`);

    const iaRes = await fetch(`${url}/api/ai/image-to-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
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
    console.log("[IA API] Success response received from microservice");

    const result = iaData.data || {};
    const generatedText = result.generated_text || result.generatedText || iaData.generated_text || '';
    const usage = result.usage || null;
    const modelUsed = result.model || '';

    if (usage) {
      console.log(`[IA API] Token Usage: Prompt=${usage.promptTokens}, Candidates=${usage.candidatesTokens}, Total=${usage.totalTokens}`);
    }

    if (!generatedText) {
      console.error("[IA API] No generated text in response:", iaData);
      return NextResponse.json({ message: 'La IA no devolvió ningún texto generado' }, { status: 500 });
    }

    // Parsear el JSON generado
    let parsed;
    try {
      let cleaned = generatedText.trim();
      cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleaned = jsonMatch[0];
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("[IA API] Error parsing generated text as JSON:", generatedText);
      return NextResponse.json({
        message: 'Error al parsear respuesta IA como JSON',
        raw: generatedText,
        usage: usage
      }, { status: 500 });
    }

    return NextResponse.json({
      ...parsed,
      usage: usage
    });
  } catch (error: any) {
    console.error("[IA API] General error:", error);
    return NextResponse.json({
      message: 'No se pudo conectar con el servicio de IA o ocurrió un error interno.',
      error: error.message
    }, { status: 500 });
  }
}
async function handleExternalImage(imageUrl: string, model: string, maxLength: any, token?: string) {
  const url = process.env.NEXT_PUBLIC_IA_URL || 'http://localhost:3004';
  const prompt = `Analiza el vestido en esta imagen. Responde SOLO con JSON válido en español.\n\nJSON requerido:\n{\n  "title": "nombre creativo del vestido",\n  "brand": "Sin marca",\n  "color": "color principal",\n  "size": "M",\n  "description": "breve descripción",\n  "price": 0,\n  "material": "No identificable",\n  "occasion": "Boda",\n  "style_notes": "detalles"\n}`;

  const body: any = {
    imageUrl: imageUrl,
    model: model,
    maxLength: maxLength ? Number(maxLength) : 200,
    prompt: prompt
  };

  const iaRes = await fetch(`${url}/api/ai/image-to-text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });

  if (!iaRes.ok) {
    const errorText = await iaRes.text();
    return NextResponse.json({ message: 'Error en servicio IA', error: errorText }, { status: iaRes.status });
  }

  const iaData = await iaRes.json();
  const generatedText = iaData.data?.generated_text || iaData.generated_text || '';

  try {
    let cleaned = generatedText.trim();
    cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];
    return NextResponse.json(JSON.parse(cleaned));
  } catch (e) {
    return NextResponse.json({ message: 'Error parseando IA', raw: generatedText }, { status: 500 });
  }
}
