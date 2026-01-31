

import { GoogleGenAI, Type } from '@google/genai';
import type { Garment } from '@/interfaces/Garment';

interface AiGarmentAnalysis {
  title: string;
  brand: string;
  description: string;
  color: string;
  price?: number;
  material?: string;
  occasion?: string;
  style_notes?: string;
}

const captureFrame = (videoEl: HTMLVideoElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      videoEl.removeEventListener('seeked', onSeeked);
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error("No se pudo obtener el contexto del canvas"));

      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      try {
        const base64ImageData = canvas.toDataURL('image/jpeg').split(',')[1];
        resolve(base64ImageData);
      } catch (e) {
        reject(e);
      }
    };

    videoEl.addEventListener('seeked', onSeeked, { once: true });
    videoEl.addEventListener('error', (e) => reject(new Error(`Error en el elemento de video: ${e}`)), { once: true });

    videoEl.currentTime = Math.min(1, videoEl.duration / 2);
  });
};

// Función auxiliar para extraer JSON de texto
const extractJSONFromText = (text: string): any => {
  // Intentar encontrar JSON en el texto
  // Buscar el primer { y el último } que formen un JSON válido
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      // Si falla, intentar limpiar el texto
      const cleaned = jsonMatch[0]
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(cleaned);
    }
  }
  throw new Error("No se encontró JSON válido en la respuesta");
};

// Función para analizar con Hugging Face (Qwen2.5-VL)
export const analyzeGarmentWithHuggingFace = async (videoElement: HTMLVideoElement): Promise<AiGarmentAnalysis> => {
  if (!videoElement) {
    throw new Error("El elemento de video no es válido.");
  }

  if (videoElement.readyState < 2) {
    await new Promise((resolve, reject) => {
      videoElement.addEventListener('loadeddata', resolve, { once: true });
      videoElement.addEventListener('error', () => reject(new Error("Error al cargar los datos del video.")), { once: true });
    });
  }

  const apiKey = typeof process !== 'undefined' && process.env ? process.env.HUGGINGFACE_API_KEY : undefined;
  if (!apiKey) {
    throw new Error("La clave de API de Hugging Face no está disponible.");
  }

  try {
    const base64ImageData = await captureFrame(videoElement);

    const prompt = `Analiza la prenda de vestir en esta imagen. Eres un catalogador de moda experto para la marca de lujo 'Vestidos de Fiesta' de Womanity Boutique. 

IMPORTANTE: Responde SOLO con un objeto JSON válido en español. No incluyas texto adicional antes o después del JSON.

El JSON debe tener exactamente estos campos:
{
  "title": "un nombre creativo y evocador",
  "brand": "una marca de la lista proporcionada",
  "color": "describe el color o patrón principal",
  "description": "una descripción corta y atractiva",
  "price": número (solo el número, sin símbolos),
  "material": "los tejidos principales, ej: Seda, Lino",
  "occasion": "la ocasión ideal, ej: Boda de día, Gala, Cóctel",
  "style_notes": "detalles clave del diseño, ej: Corte sirena, Espalda descubierta"
}

Lista de marcas disponibles: Marchesa Notte, Badgley Mischka, Tadashi Shoji, Adrianna Papell, Vera Wang, Carolina Herrera, Oscar de la Renta, Pronovias, Rosa Clará, Michael Kors, Ralph Lauren, Elie Saab, Zuhair Murad, Jenny Packham, Monique Lhuillier.`;

    const response = await fetch(
      'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-VL-7B-Instruct',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {
            image: `data:image/jpeg;base64,${base64ImageData}`,
            text: prompt
          },
          parameters: {
            max_new_tokens: 500,
            return_full_text: false,
            temperature: 0.3
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
      if (response.status === 503) {
        throw new Error("El modelo está cargando. Por favor, espera unos segundos e intenta de nuevo.");
      }
      throw new Error(`Error de Hugging Face API: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();

    // Hugging Face puede devolver diferentes formatos
    let textResponse = '';
    if (Array.isArray(data) && data[0]?.generated_text) {
      textResponse = data[0].generated_text;
    } else if (data.generated_text) {
      textResponse = data.generated_text;
    } else if (data[0]?.text) {
      textResponse = data[0].text;
    } else if (typeof data === 'string') {
      textResponse = data;
    } else {
      throw new Error("Formato de respuesta inesperado de Hugging Face");
    }

    // Extraer JSON del texto
    const parsed = extractJSONFromText(textResponse);

    // Validar y retornar
    return {
      title: parsed.title || '',
      brand: parsed.brand || '',
      color: parsed.color || '',
      description: parsed.description || '',
      price: typeof parsed.price === 'number' ? parsed.price : undefined,
      material: parsed.material || '',
      occasion: parsed.occasion || '',
      style_notes: parsed.style_notes || ''
    };

  } catch (error) {
    console.error("Error en analyzeGarmentWithHuggingFace:", error);
    throw new Error(`Fallo en el análisis con Hugging Face: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Función principal con fallback automático
export const analyzeGarmentWithAI = async (videoElement: HTMLVideoElement): Promise<AiGarmentAnalysis> => {
  if (!videoElement) {
    throw new Error("El elemento de video no es válido.");
  }

  if (videoElement.readyState < 2) {
    await new Promise((resolve, reject) => {
      videoElement.addEventListener('loadeddata', resolve, { once: true });
      videoElement.addEventListener('error', () => reject(new Error("Error al cargar los datos del video.")), { once: true });
    });
  }

  const apiKey = typeof process === 'object' && process.env ? process.env.API_KEY : undefined;
  if (!apiKey) throw new Error("La clave de API no está disponible.");

  try {
    const base64ImageData = await captureFrame(videoElement);
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64ImageData } },
          { text: "Analiza la prenda de vestir en esta imagen. Eres un catalogador de moda experto para la marca de lujo 'Vestidos de Fiesta' de Womanity Boutique. La respuesta debe estar completamente en español. Proporciona un objeto JSON con los siguientes campos: 'title' (un nombre creativo y evocador), 'brand' (sugiere una marca de nuestra lista), 'color' (describe el color o patrón principal), 'description' (una descripción corta y atractiva), 'price' (un precio de venta sugerido como número), 'material' (los tejidos principales, ej: 'Seda, Lino'), 'occasion' (la ocasión ideal, ej: 'Boda de día, Gala, Cóctel'), y 'style_notes' (detalles clave del diseño, ej: 'Corte sirena, Espalda descubierta'). Lista de marcas: 'Marchesa Notte', 'Badgley Mischka', 'Tadashi Shoji', 'Adrianna Papell', 'Vera Wang', 'Carolina Herrera', 'Oscar de la Renta', 'Pronovias', 'Rosa Clará', 'Michael Kors', 'Ralph Lauren', 'Elie Saab', 'Zuhair Murad', 'Jenny Packham', 'Monique Lhuillier'." },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            brand: { type: Type.STRING },
            color: { type: Type.STRING },
            description: { type: Type.STRING },
            price: { type: Type.NUMBER },
            material: { type: Type.STRING },
            occasion: { type: Type.STRING },
            style_notes: { type: Type.STRING },
          },
          required: ["title", "brand", "color", "description", "material", "occasion", "style_notes"],
        },
      },
    });

    return JSON.parse(response.text);

  } catch (error) {
    console.error("Error con Gemini AI:", error);

    // Fallback a Hugging Face si Gemini falla
    console.log("Intentando con Hugging Face como alternativa...");
    try {
      return await analyzeGarmentWithHuggingFace(videoElement);
    } catch (hfError) {
      console.error("Error con Hugging Face:", hfError);
      throw new Error(`Fallo en el análisis de IA. Gemini: ${error instanceof Error ? error.message : String(error)}. Hugging Face: ${hfError instanceof Error ? hfError.message : String(hfError)}`);
    }
  }
};


export const generateArticleWithAI = async (garment: Garment): Promise<{ title: string; excerpt: string; content: string; }> => {
  const apiKey = typeof process === 'object' && process.env ? process.env.API_KEY : undefined;
  if (!apiKey) throw new Error("La clave de API no está disponible.");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
      Eres un copywriter de moda experto para el blog de "Womanity Boutique". Tu tono es inspirador, elegante y cercano.
      Crea un artículo de blog sobre la siguiente prenda:
      - Título de la prenda: "${garment.title}"
      - Marca: ${garment.brand}
      - Descripción: "${garment.description}"
      - Ocasión ideal: ${garment.occasion || 'cualquier evento especial'}
      - Notas de estilo: ${garment.style_notes || 'diseño exclusivo'}

      El artículo debe tener:
      1. Un título (campo 'title') atractivo y original que no sea simplemente el nombre de la prenda.
      2. Un extracto (campo 'excerpt') de 1-2 frases que resuma el artículo y enganche al lector.
      3. El contenido principal (campo 'content') en formato HTML. Debe tener al menos 3 párrafos, usar etiquetas <p>, <strong> y <ul> con <li> para listas. Debe ser creativo y contar una historia sobre la prenda, dar consejos de estilo y resaltar por qué es una elección especial.

      La respuesta debe ser un objeto JSON en español con los campos: "title", "excerpt", y "content".
    `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            excerpt: { type: Type.STRING },
            content: { type: Type.STRING },
          },
          required: ["title", "excerpt", "content"],
        },
      },
    });

    return JSON.parse(response.text);

  } catch (error) {
    console.error("Error generating article with AI:", error);
    throw new Error(`Fallo en la generación de artículo por IA: ${error instanceof Error ? error.message : String(error)}`);
  }
};