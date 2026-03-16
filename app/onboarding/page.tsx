"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SpinnerIcon, CheckIcon, UploadIcon, SparklesIcon, PaletteIcon, PenIcon } from '@/components/ui/Icons';

type Step = 'WELCOME' | 'CONTEXT' | 'AI_PROCESS' | 'REFINEMENT' | 'SUCCESS';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('WELCOME');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Data
  const [businessData, setBusinessData] = useState({
    name: '',
    category: '',
    logoBase64: ''
  });

  // AI Result Data
  const [aiResult, setAiResult] = useState({
    brandPrompt: '',
    colors: {
      primary: '#000000',
      secondary: '#D5B46E',
      background: '#F9F8F6',
      text: '#1C1917'
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBusinessData(prev => ({ ...prev, logoBase64: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const startAIProcess = async () => {
    setStep('AI_PROCESS');
    setIsLoading(true);
    setError(null);

    try {
      // Prompt especializado para generar la identidad de marca
      const specializedPrompt = `Analiza este logo y el contexto del negocio: "${businessData.name}" en el nicho "${businessData.category}". 
      Genera una IDENTIDAD DE MARCA (Brand Prompt) sofisticada que describa la esencia visual, el tono de voz y la estética deseada para la tienda.
      Extrae los 4 colores principales que mejor representen esta identidad (en formato HEX).
      Responde SOLO con JSON válido:
      {
        "brand_prompt": "descripción detallada de la identidad",
        "colors": {
          "primary": "#HEX",
          "secondary": "#HEX",
          "background": "#HEX",
          "text": "#HEX"
        },
        "description": "una breve descripción para SEO"
      }`;

      const res = await fetch('/api/ia/analyze-garment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: businessData.logoBase64,
          prompt: specializedPrompt
        })
      });

      if (!res.ok) throw new Error('Error al procesar con IA');
      
      const data = await res.json();
      
      setAiResult({
        brandPrompt: data.brand_prompt || '',
        colors: {
          primary: data.colors?.primary || '#000000',
          secondary: data.colors?.secondary || '#D5B46E',
          background: data.colors?.background || '#F9F8F6',
          text: data.colors?.text || '#1C1917'
        }
      });
      
      setStep('REFINEMENT');
    } catch (err: any) {
      setError(err.message);
      setStep('CONTEXT');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTheme = async () => {
    setIsLoading(true);
    try {
      // 1. Guardar Información de la Tienda
      const infoRes = await fetch('/api/theme/store-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: businessData.name,
          description: aiResult.brandPrompt.substring(0, 200),
          // Aquí podríamos añadir más campos si el microservicio los soporta
        })
      });

      if (!infoRes.ok) throw new Error('Error al guardar información');

      // 2. Guardar Colores
      const colorRes = await fetch('/api/theme/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          color_one: aiResult.colors.primary,
          color_two: aiResult.colors.secondary,
          color_three: aiResult.colors.background,
          color_four: aiResult.colors.text,
        })
      });

      if (!colorRes.ok) throw new Error('Error al guardar colores');

      setStep('SUCCESS');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center p-4 font-sans text-stone-900">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-stone-100 overflow-hidden">
        
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-stone-100 flex">
          <div className={`h-full bg-stone-900 transition-all duration-500 ${
            step === 'WELCOME' ? 'w-1/5' : 
            step === 'CONTEXT' ? 'w-2/5' : 
            step === 'AI_PROCESS' ? 'w-3/5' : 
            step === 'REFINEMENT' ? 'w-4/5' : 'w-full'
          }`} />
        </div>

        <div className="p-8 md:p-12">
          
          {/* STEP: WELCOME */}
          {step === 'WELCOME' && (
            <div className="text-center space-y-8 animate-fade-in">
              <div className="w-20 h-20 bg-stone-900 rounded-full flex items-center justify-center mx-auto shadow-xl">
                <SparklesIcon className="w-10 h-10 text-[#D5B46E] animate-pulse" />
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-serif tracking-tight">¡Tu tienda ha nacido!</h1>
                <p className="text-lg text-stone-600 max-w-sm mx-auto">
                  Ahora vamos a darle una personalidad única. Configuraremos tu marca y diseño usando Inteligencia Artificial.
                </p>
              </div>
              <button 
                onClick={() => setStep('CONTEXT')}
                className="inline-flex items-center gap-2 bg-stone-900 text-white px-10 py-4 rounded-full font-medium hover:bg-stone-800 transition-all transform hover:scale-105"
              >
                Comenzar Configuración Visual
              </button>
            </div>
          )}

          {/* STEP: CONTEXT */}
          {step === 'CONTEXT' && (
            <div className="space-y-8 animate-slide-up">
              <div className="text-center">
                <h2 className="text-3xl font-serif">Cuéntanos de tu negocio</h2>
                <p className="text-stone-500 mt-2">Estos datos ayudarán a la IA a diseñar tu identidad.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-stone-500">Nombre del Negocio</label>
                  <input 
                    type="text" 
                    value={businessData.name}
                    onChange={e => setBusinessData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-4 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all"
                    placeholder="Ej. Womanity Boutique"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 uppercase tracking-wider text-stone-500">Nicho / Categoría</label>
                  <input 
                    type="text" 
                    value={businessData.category}
                    onChange={e => setBusinessData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-4 rounded-xl border border-stone-200 focus:ring-2 focus:ring-stone-900 focus:border-transparent outline-none transition-all"
                    placeholder="Ej. Vestidos de gala y noche"
                  />
                </div>

                <div className="pt-2">
                  <label className="block text-sm font-medium mb-4 uppercase tracking-wider text-stone-500 text-center">Logo de la Marca</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-200 rounded-2xl p-8 text-center cursor-pointer hover:border-stone-400 transition-all bg-stone-50 overflow-hidden"
                  >
                    {businessData.logoBase64 ? (
                      <img src={businessData.logoBase64} alt="Logo" className="max-h-32 mx-auto object-contain" />
                    ) : (
                      <div className="space-y-2">
                        <UploadIcon className="w-10 h-10 mx-auto text-stone-400" />
                        <p className="text-sm text-stone-500">Click para subir tu logo</p>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleLogoUpload} />
                  </div>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <button 
                onClick={startAIProcess}
                disabled={!businessData.name || !businessData.logoBase64}
                className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white p-4 rounded-xl font-medium hover:bg-stone-800 disabled:bg-stone-200 transition-all font-serif text-lg"
              >
                Generar Identidad con IA
                <SparklesIcon className="w-5 h-5 text-[#D5B46E]" />
              </button>
            </div>
          )}

          {/* STEP: AI_PROCESS */}
          {step === 'AI_PROCESS' && (
            <div className="text-center space-y-12 py-10 animate-fade-in">
              <div className="relative w-32 h-32 mx-auto">
                <SpinnerIcon className="w-full h-full text-stone-200 animate-spin" />
                <SparklesIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-[#D5B46E] animate-bounce" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-serif">La IA está creando tu mundo...</h3>
                <div className="space-y-2">
                  <p className="text-stone-500 text-sm animate-pulse">Analizando colores del logo...</p>
                  <p className="text-stone-400 text-xs">Redactando manifiesto de marca...</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP: REFINEMENT */}
          {step === 'REFINEMENT' && (
            <div className="space-y-8 animate-slide-up">
              <div className="text-center">
                <h2 className="text-3xl font-serif">Personaliza tu Identidad</h2>
                <p className="text-stone-500 mt-2">Ajusta lo que la IA ha propuesto para ti.</p>
              </div>

              <div className="space-y-6">
                <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 relative">
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-2 flex items-center gap-2">
                    <PenIcon className="w-3 h-3" /> Manifiesto de Marca (Prompt)
                  </label>
                  <textarea 
                    value={aiResult.brandPrompt}
                    onChange={e => setAiResult(prev => ({ ...prev, brandPrompt: e.target.value }))}
                    className="w-full bg-transparent border-none focus:ring-0 text-stone-800 leading-relaxed text-sm resize-none h-32"
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                    <PaletteIcon className="w-3 h-3" /> Paleta de Colores Sugerida
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {Object.entries(aiResult.colors).map(([key, val]) => (
                      <div key={key} className="space-y-2 text-center">
                        <div 
                          className="h-16 rounded-xl border border-stone-200 shadow-inner" 
                          style={{ backgroundColor: val }}
                        />
                        <p className="text-[10px] font-mono text-stone-500">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep('CONTEXT')}
                  className="w-1/3 p-4 rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 transition-all font-medium"
                >
                  Atrás
                </button>
                <button 
                  onClick={handleSaveTheme}
                  disabled={isLoading}
                  className="w-2/3 flex items-center justify-center gap-2 bg-stone-900 text-white p-4 rounded-xl font-medium hover:bg-stone-800 transition-all font-serif text-lg"
                >
                  {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Finalizar y Entrar'}
                </button>
              </div>
            </div>
          )}

          {/* STEP: SUCCESS */}
          {step === 'SUCCESS' && (
            <div className="text-center space-y-8 py-10 animate-fade-in">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
                <CheckIcon className="w-12 h-12 text-white" />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-serif">¡Todo listo!</h2>
                <p className="text-lg text-stone-600">Redirigiéndote a tu nueva tienda...</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
