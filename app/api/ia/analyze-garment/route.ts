import { NextRequest, NextResponse } from 'next/server';

// POST /api/ia/analyze-garment
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const model = 'Salesforce/blip-image-captioning-base';

    let imageBase64 = '';
    let maxLength: string | undefined = undefined;
    // Permitir tanto JSON como form-data
    if (contentType.includes('application/json')) {
      const body = await req.json();
      imageBase64 = body.imageBase64;
      maxLength = body.maxLength;
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      imageBase64 = formData.get('imageBase64') as string;
      const maxLengthValue = formData.get('maxLength');
      maxLength = typeof maxLengthValue === 'string' ? maxLengthValue : undefined;
    } else {
      return NextResponse.json({ message: 'Content-Type no soportado' }, { status: 400 });
    }

    if (!imageBase64) {
      return NextResponse.json({ message: 'Falta imageBase64' }, { status: 400 });
    }

    // Lógica: llamar al microservicio de IA (igual que iaService.analyzeGarmentFromBase64)
    const url = process.env.NEXT_PUBLIC_IA_URL || 'https://ia.iaimpacto.com';
    const prompt = `Analiza el vestido en esta imagen. Responde SOLO con JSON válido en español.\n\nJSON requerido:\n{\n  "title": "nombre creativo del vestido",\n  "brand": "marca de la lista o 'Sin marca'",\n  "color": "color/patrón principal",\n  "description": "descripción breve (2-3 frases)",\n  "price": número,\n  "material": "tejidos identificables o 'No identificable'",\n  "occasion": "ocasión ideal (Boda, Gala, Cóctel, etc)",\n  "style_notes": "detalles de diseño (corte, escote, mangas, etc)"\n}\n\nMarcas: Marchesa Notte, Badgley Mischka, Tadashi Shoji, Adrianna Papell, Vera Wang, Carolina Herrera, Oscar de la Renta, Pronovias, Rosa Clará, Michael Kors, Ralph Lauren, Elie Saab, Zuhair Murad, Jenny Packham, Monique Lhuillier.\n\nObserva: estilo, detalles decorativos, tipo de tela, color, silueta, diseño.`;
    const body = {
      imageBase64,
      model: model,
      maxLength: maxLength ? Number(maxLength) : 200,
      prompt
    };
    console.log("Body:", body);
    const iaRes = await fetch(`${url}/api/ai/image-to-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    console.log("[IA API] Success response:", iaData);

    const generatedText = iaData.data?.generatedText || iaData.data?.generated_text || '';
    // Parsear el JSON generado
    let parsed;
    try {
      let cleaned = generatedText.trim();
      cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleaned = jsonMatch[0];
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error("[IA API] Error parsing generated text:", generatedText);
      return NextResponse.json({ message: 'Error al parsear respuesta IA', raw: generatedText }, { status: 500 });
    }
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("[IA API] Fetch failed:", error);
    return NextResponse.json({
      message: 'No se pudo conectar con el servicio de IA. Verifica que el microservicio esté activo.',
      error: error.message
    }, { status: 500 });
  }
}
