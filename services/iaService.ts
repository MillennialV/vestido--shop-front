/**
 * IA Service Client - SDK para usar el microservicio de IA
 * 
 * Uso:
 * const client = new IAServiceClient('http://tu-servidor:3004', 'tu-token-opcional');
 * const text = await client.generateText('Escribe sobre IA');
 */

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  formData?: FormData;
}

interface GenerateTextOptions {
  maxLength?: number;
  temperature?: number;
  topP?: number;
  model?: string;
  doSample?: boolean;
  returnFullText?: boolean;
}

interface SummarizeOptions {
  maxLength?: number;
  minLength?: number;
  model?: string;
}

interface ImageToTextOptions {
  prompt?: string;
  model?: string;
  maxLength?: number;
}

interface ApiResponse<T = any> {
  data: T;
  message?: string;
}

interface SentimentAnalysisResult {
  label: string;
  score: number;
}

interface QuestionAnsweringResult {
  answer: string;
  score?: number;
}

interface EmbeddingResult {
  embedding: number[];
}

interface NERResult {
  entities: Array<{
    word: string;
    entity: string;
    score: number;
  }>;
}

interface ModelStatus {
  loaded: boolean;
  model?: string;
}

export interface GarmentAnalysisResult {
  title: string;
  brand: string;
  color: string;
  description: string;
  price?: number;
  material?: string;
  occasion?: string;
  style_notes?: string;
}

class IAServiceClient {
  private baseUrl: string;
  private token: string | null;

  constructor(baseUrl?: string, token: string | null = null) {
    // Usar la variable de entorno si no se proporciona baseUrl
    const url = baseUrl || process.env.NEXT_PUBLIC_IA_URL || 'https://ia.iaimpacto.com';
    this.baseUrl = url.replace(/\/$/, '');
    this.token = token;

    // Log para debugging
    console.log(`[IA Service] Inicializado con URL: ${this.baseUrl}`);
    console.log(`[IA Service] NEXT_PUBLIC_IA_URL desde env:`, process.env.NEXT_PUBLIC_IA_URL || 'no configurado');
  }

  /**
   * Método helper para hacer requests
   */
  private async _request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers
    };

    const config: RequestInit = {
      method: options.method || 'POST',
      headers,
      ...(options.body && { body: JSON.stringify(options.body) })
    };

    // Si es FormData, no establecer Content-Type (el navegador lo hace automáticamente)
    if (options.formData) {
      delete headers['Content-Type'];
      config.body = options.formData;
    }

    try {
      console.log(`[IA Service] Haciendo request a: ${url}`);
      const response = await fetch(url, config);

      // Verificar el tipo de contenido antes de parsear
      const contentType = response.headers.get('content-type');
      let data: ApiResponse<T>;

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          const text = await response.text();
          console.error(`[IA Service] Error al parsear JSON. Status: ${response.status}. Respuesta:`, text.substring(0, 500));
          throw new Error(`Error al parsear respuesta JSON (${response.status}): ${text.substring(0, 200)}`);
        }
      } else {
        const text = await response.text();
        console.error(`[IA Service] Respuesta no es JSON. Status: ${response.status}. Content-Type: ${contentType}. Respuesta:`, text.substring(0, 500));
        throw new Error(`Respuesta inesperada del servidor (${response.status}): ${text.substring(0, 200)}`);
      }

      if (!response.ok) {
        const errorMsg = data.message || `Error ${response.status}: ${response.statusText}`;
        console.error(`[IA Service] Error en respuesta:`, errorMsg);
        throw new Error(errorMsg);
      }

      return data;
    } catch (error) {
      // Manejar errores de CORS específicamente
      if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
        console.error(`[IA Service] Error de CORS o conexión a: ${url}`);
        throw new Error(`Error de conexión: No se pudo conectar al servicio de IA en ${this.baseUrl}. Verifica que la URL esté accesible y que CORS esté configurado correctamente para permitir requests desde ${window.location.origin}.`);
      }

      if (error instanceof Error) {
        console.error(`[IA Service] Error:`, error.message);
        throw error;
      }

      throw new Error(`Error de conexión: ${String(error)}`);
    }
  }

  /**
   * Obtener información del servicio
   */
  async getInfo(): Promise<ApiResponse> {
    return this._request('/api/info', { method: 'GET' });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse> {
    return this._request('/health', { method: 'GET' });
  }

  /**
   * Generar texto
   * @param prompt - Texto inicial
   * @param options - Opciones adicionales
   */
  async generateText(prompt: string, options: GenerateTextOptions = {}): Promise<string> {
    const result = await this._request<{ generated_text: string }>('/api/ai/text-generation', {
      body: {
        prompt,
        maxLength: options.maxLength || 512,
        temperature: options.temperature || 0.7,
        topP: options.topP || 0.9,
        model: options.model,
        doSample: options.doSample,
        returnFullText: options.returnFullText
      }
    });
    return result.data.generated_text;
  }

  /**
   * Analizar sentimientos
   * @param text - Texto a analizar
   * @param model - Modelo opcional
   */
  async analyzeSentiment(text: string, model?: string): Promise<SentimentAnalysisResult> {
    const result = await this._request<SentimentAnalysisResult>('/api/ai/sentiment-analysis', {
      body: {
        text,
        ...(model && { model })
      }
    });
    return result.data;
  }

  /**
   * Resumir texto
   * @param text - Texto a resumir
   * @param options - Opciones
   */
  async summarize(text: string, options: SummarizeOptions = {}): Promise<string> {
    const result = await this._request<{ summary_text: string }>('/api/ai/summarization', {
      body: {
        text,
        maxLength: options.maxLength || 130,
        minLength: options.minLength || 30,
        model: options.model
      }
    });
    return result.data.summary_text;
  }

  /**
   * Traducir texto
   * @param text - Texto a traducir
   * @param targetLanguage - Idioma destino (ej: 'es', 'en', 'fr')
   * @param sourceLanguage - Idioma origen (opcional)
   */
  async translate(text: string, targetLanguage: string = 'es', sourceLanguage: string = 'en'): Promise<string> {
    const result = await this._request<{ translation_text: string }>('/api/ai/translation', {
      body: {
        text,
        targetLanguage,
        sourceLanguage
      }
    });
    return result.data.translation_text;
  }

  /**
   * Responder pregunta basada en contexto
   * @param question - Pregunta
   * @param context - Contexto
   * @param model - Modelo opcional
   */
  async answerQuestion(question: string, context: string, model?: string): Promise<QuestionAnsweringResult> {
    const result = await this._request<QuestionAnsweringResult>('/api/ai/question-answering', {
      body: {
        question,
        context,
        ...(model && { model })
      }
    });
    return result.data;
  }

  /**
   * Obtener embedding de texto
   * @param text - Texto
   * @param model - Modelo opcional
   */
  async getEmbedding(text: string, model?: string): Promise<EmbeddingResult> {
    const result = await this._request<EmbeddingResult>('/api/ai/text-embedding', {
      body: {
        text,
        ...(model && { model })
      }
    });
    return result.data;
  }

  /**
   * Extraer entidades nombradas (NER)
   * @param text - Texto
   * @param model - Modelo opcional
   */
  async extractEntities(text: string, model?: string): Promise<NERResult> {
    const result = await this._request<NERResult>('/api/ai/named-entity-recognition', {
      body: {
        text,
        ...(model && { model })
      }
    });
    return result.data;
  }

  /**
   * Generar texto desde imagen (URL)
   * @param imageUrl - URL de la imagen
   * @param prompt - Prompt/pregunta sobre la imagen (opcional)
   * @param options - Opciones adicionales
   */
  async imageToTextFromUrl(imageUrl: string, prompt?: string | null, options: ImageToTextOptions = {}): Promise<string> {
    const body: any = {
      imageUrl,
      model: options.model || 'Qwen/Qwen3-VL-8B-Instruct',
      maxLength: options.maxLength || 50
    };

    // Solo agregar prompt si se proporciona uno
    const finalPrompt = prompt || options.prompt;
    if (finalPrompt) {
      body.prompt = finalPrompt;
    }

    const result = await this._request<{ generatedText?: string; generated_text?: string }>('/api/ai/image-to-text', {
      body
    });
    // La API puede devolver generatedText o generated_text
    return result.data.generatedText || result.data.generated_text || '';
  }

  /**
   * Generar texto desde imagen (Base64)
   * @param imageBase64 - Imagen en Base64 (con o sin prefijo data:image/...)
   * @param prompt - Prompt/pregunta sobre la imagen (opcional)
   * @param options - Opciones adicionales
   */
  async imageToTextFromBase64(imageBase64: string, prompt?: string | null, options: ImageToTextOptions = {}): Promise<string> {
    const body: any = {
      imageBase64,
      model: options.model || 'Qwen/Qwen3-VL-8B-Instruct',
      maxLength: options.maxLength || 50
    };

    // Solo agregar prompt si se proporciona uno
    const finalPrompt = prompt || options.prompt;
    if (finalPrompt) {
      body.prompt = finalPrompt;
    }

    const result = await this._request<{ generatedText?: string; generated_text?: string }>('/api/ai/image-to-text', {
      body
    });
    // La API puede devolver generatedText o generated_text
    return result.data.generatedText || result.data.generated_text || '';
  }

  /**
   * Generar texto desde imagen (archivo File/Blob)
   * @param imageFile - Archivo de imagen
   * @param prompt - Prompt/pregunta sobre la imagen (opcional)
   * @param options - Opciones adicionales
   */
  async imageToTextFromFile(imageFile: File | Blob, prompt?: string | null, options: ImageToTextOptions = {}): Promise<string> {
    const formData = new FormData();
    formData.append('image', imageFile);

    if (prompt || options.prompt) {
      formData.append('prompt', prompt || options.prompt || '');
    }

    formData.append('model', options.model || 'Qwen/Qwen3-VL-8B-Instruct');

    if (options.maxLength) {
      formData.append('maxLength', options.maxLength.toString());
    }

    const result = await this._request<{ generatedText?: string; generated_text?: string }>('/api/ai/image-to-text', {
      formData
    });
    // La API puede devolver generatedText o generated_text
    return result.data.generatedText || result.data.generated_text || '';
  }

  /**
   * Analizar vestido/prenda desde imagen (URL)
   * Extrae información estructurada sobre el atuendo para catálogo de vestidos
   * @param imageUrl - URL de la imagen
   * @param options - Opciones adicionales
   */
  async analyzeGarmentFromUrl(imageUrl: string, options: ImageToTextOptions = {}): Promise<GarmentAnalysisResult> {
    const prompt = this.getGarmentAnalysisPrompt();
    const body: any = {
      imageUrl,
      model: options.model || 'Qwen/Qwen3-VL-8B-Instruct',
      maxLength: options.maxLength || 200,
      prompt
    };

    const result = await this._request<{
      success: boolean;
      generatedText?: string;
      generated_text?: string;
      model?: string;
      imageSize?: number;
    }>('/api/ai/image-to-text', {
      body
    });

    // Extraer el texto generado (puede venir como generatedText o generated_text)
    const generatedText = result.data.generatedText || result.data.generated_text || '';

    // Si generatedText es un objeto (ya parseado), devolverlo directamente
    if (typeof generatedText === 'object') {
      return this.parseGarmentAnalysis(JSON.stringify(generatedText));
    }

    // Si es string, parsearlo
    return this.parseGarmentAnalysis(generatedText);
  }

  /**
   * Analizar vestido/prenda desde imagen (Base64)
   * Extrae información estructurada sobre el atuendo para catálogo de vestidos
   * @param imageBase64 - Imagen en Base64
   * @param options - Opciones adicionales
   */
  async analyzeGarmentFromBase64(imageBase64: string, options: ImageToTextOptions = {}): Promise<GarmentAnalysisResult> {
    const prompt = this.getGarmentAnalysisPrompt();
    const body: any = {
      imageBase64,
      model: options.model || 'Qwen/Qwen3-VL-8B-Instruct',
      maxLength: options.maxLength || 200,
      prompt
    };

    const result = await this._request<{
      success: boolean;
      generatedText?: string;
      generated_text?: string;
      model?: string;
      imageSize?: number;
    }>('/api/ai/image-to-text', {
      body
    });

    // Log para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('[IA Service] Respuesta completa de analyzeGarmentFromBase64:', result);
    }

    // Extraer el texto generado (puede venir como generatedText o generated_text)
    const generatedText = result.data.generatedText || result.data.generated_text || '';

    if (!generatedText) {
      console.error('[IA Service] No se recibió generatedText en la respuesta:', result);
      throw new Error('La respuesta de la API no contiene texto generado');
    }

    // Si generatedText es un objeto (ya parseado), devolverlo directamente
    if (typeof generatedText === 'object') {
      return this.parseGarmentAnalysis(JSON.stringify(generatedText));
    }

    // Si es string, parsearlo
    return this.parseGarmentAnalysis(generatedText);
  }

  /**
   * Analizar vestido/prenda desde imagen (archivo File/Blob)
   * Extrae información estructurada sobre el atuendo para catálogo de vestidos
   * @param imageFile - Archivo de imagen
   * @param options - Opciones adicionales
   */
  async analyzeGarmentFromFile(imageFile: File | Blob, options: ImageToTextOptions = {}): Promise<GarmentAnalysisResult> {
    const prompt = this.getGarmentAnalysisPrompt();
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('prompt', prompt);
    formData.append('model', options.model || 'Qwen/Qwen3-VL-8B-Instruct');
    formData.append('maxLength', (options.maxLength || 200).toString());

    const result = await this._request<{
      success: boolean;
      generatedText?: string;
      generated_text?: string;
      model?: string;
      imageSize?: number;
    }>('/api/ai/image-to-text', {
      formData
    });

    // Extraer el texto generado (puede venir como generatedText o generated_text)
    const generatedText = result.data.generatedText || result.data.generated_text || '';

    // Si generatedText es un objeto (ya parseado), devolverlo directamente
    if (typeof generatedText === 'object') {
      return this.parseGarmentAnalysis(JSON.stringify(generatedText));
    }

    // Si es string, parsearlo
    return this.parseGarmentAnalysis(generatedText);
  }

  /**
   * Obtiene el prompt generalizado para análisis de vestidos
   * @private
   */
  private getGarmentAnalysisPrompt(): string {
    return `Analiza el vestido en esta imagen. Responde SOLO con JSON válido en español.

JSON requerido:
{
  "title": "nombre creativo del vestido",
  "brand": "marca de la lista o 'Sin marca'",
  "color": "color/patrón principal",
  "description": "descripción breve (2-3 frases)",
  "price": número,
  "material": "tejidos identificables o 'No identificable'",
  "occasion": "ocasión ideal (Boda, Gala, Cóctel, etc)",
  "style_notes": "detalles de diseño (corte, escote, mangas, etc)"
}

Marcas: Marchesa Notte, Badgley Mischka, Tadashi Shoji, Adrianna Papell, Vera Wang, Carolina Herrera, Oscar de la Renta, Pronovias, Rosa Clará, Michael Kors, Ralph Lauren, Elie Saab, Zuhair Murad, Jenny Packham, Monique Lhuillier.

Observa: estilo, detalles decorativos, tipo de tela, color, silueta, diseño.`;
  }

  /**
   * Parsea el resultado de texto a objeto estructurado de análisis de vestido
   * @private
   */
  private parseGarmentAnalysis(textResult: string): GarmentAnalysisResult {
    try {
      // Si el texto ya es un objeto, devolverlo directamente
      if (typeof textResult === 'object') {
        const parsed = textResult as any;
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
      }

      // Limpiar el string: remover caracteres de escape y espacios extra
      let cleaned = textResult.trim();

      // Remover markdown code blocks si existen
      cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();

      // Intentar extraer JSON del texto si hay texto adicional
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }

      // Parsear el JSON
      const parsed = JSON.parse(cleaned);

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
      // Si falla el parsing, lanzar error con el texto original para debugging
      throw new Error(`Error al parsear la respuesta de análisis: ${error instanceof Error ? error.message : String(error)}. Respuesta recibida: ${textResult.substring(0, 200)}...`);
    }
  }

  /**
   * Verificar estado de un modelo
   * @param model - Nombre del modelo
   */
  async checkModelStatus(model: string): Promise<ModelStatus> {
    const result = await this._request<ModelStatus>(`/api/ai/models/${encodeURIComponent(model)}/status`, {
      method: 'GET'
    });
    return result.data;
  }
}

// Exportar la clase
export default IAServiceClient;

// También exportar una instancia por defecto usando la variable de entorno
export const iaService = new IAServiceClient();

