import React from 'react';
import { ShoppingBagIcon, SparklesIcon } from './Icons';

export const StoreNotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="relative inline-block">
          <div className="bg-white p-6 rounded-full shadow-xl ring-1 ring-stone-200">
            <ShoppingBagIcon className="w-16 h-16 text-stone-300" />
          </div>
          <div className="absolute -top-2 -right-2">
            <SparklesIcon className="w-8 h-8 text-amber-400 animate-pulse" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-serif text-stone-900 tracking-tight">
            Próximamente
          </h1>
          <p className="text-lg text-stone-600 font-light leading-relaxed">
            Esta tienda aún no está disponible o no ha sido configurada. 
            Estamos trabajando para brindarte la mejor experiencia de compra.
          </p>
        </div>

        <div className="pt-8">
          <a
            href="https://abrepe.com"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-stone-900 hover:bg-stone-800 transition-colors duration-200 shadow-lg"
          >
            Volver al inicio
          </a>
        </div>

        <div className="pt-12 border-t border-stone-200">
          <p className="text-sm text-stone-400">
            Si eres el dueño de esta tienda, termina de realizar las configuraciones de dominio y tema para su uso.
          </p>
        </div>

      </div>
      
      {/* Decorative background elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-amber-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-stone-200/50 rounded-full blur-3xl" />
      </div>
    </div>
  );
};
