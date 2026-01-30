import React, { useEffect, useRef, useState } from 'react';
import type { Garment } from '../types';
import ThumbnailStrip from './ThumbnailStrip';
import QrCodeModal from './QrCodeModal';
import { PUBLIC_URL } from '../lib/seo';
import AccordionItem from './AccordionItem';
import { CloseIcon, SparklesIcon, SpinnerIcon, WhatsappIcon, ShareIcon, QrCodeIcon, TikTokIcon, InstagramIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';

interface VideoModalProps {
  garment: Garment;
  onClose: () => void;
  garmentList: Garment[];
  onChangeGarment: (garment: Garment) => void;
  onGenerateArticle?: (garment: Garment) => void;
  isGeneratingArticle: boolean;
  articleExists: boolean;
}

const VideoModal: React.FC<VideoModalProps> = ({ garment, onClose, garmentList, onChangeGarment, onGenerateArticle, isGeneratingArticle, articleExists }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isThumbnailStripVisible, setIsThumbnailStripVisible] = useState(true);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>('description');

  const handleAccordionClick = (id: string) => {
    setOpenAccordion(prev => (prev === id ? null : id));
  };


  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Corresponds to animation duration
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
        return;
      }
      
      const currentIndex = garmentList.findIndex(g => g.id === garment.id);
      if (currentIndex === -1) return;

      let nextIndex = -1;
      
      if (event.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % garmentList.length;
      } else if (event.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + garmentList.length) % garmentList.length;
      }
      
      if (nextIndex !== -1) {
        event.preventDefault();
        onChangeGarment(garmentList[nextIndex]);
      }
    };

    closeButtonRef.current?.focus();
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, garment, garmentList, onChangeGarment]);
  
  const handleShare = () => {
    if (!garment.slug) {
        setToastMessage('Error: No se pudo generar el enlace.');
        setTimeout(() => setToastMessage(null), 3000);
        return;
    }
    const shareUrl = `${PUBLIC_URL}/#/${garment.slug}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        setToastMessage('¡Enlace copiado!');
        setTimeout(() => setToastMessage(null), 3000);
    }).catch(err => {
        console.error('Failed to copy link: ', err);
        setToastMessage('Error al copiar el enlace.');
        setTimeout(() => setToastMessage(null), 3000);
    });
  };
  
  const handleSocialShare = async (platform: 'TikTok' | 'Instagram') => {
      if (!garment.videoUrl) return;

      const fileName = `vestidos-de-fiesta-${garment.title.toLowerCase().replace(/\s+/g, '-')}.mp4`;
      const shareDetails = {
          title: `${garment.title} - Colección Vestidos de Fiesta`,
          text: `Descubre este vestido de la nueva colección de Vestidos de Fiesta por Womanity Boutique. #VestidosDeFiesta #WomanityBoutique #ModaDeLujo #${garment.brand.replace(/\s+/g, '')}`,
      };

      try {
          const response = await fetch(garment.videoUrl);
          if (!response.ok) {
              throw new Error(`La respuesta de la red no fue correcta, estado: ${response.status}`);
          }
          const blob = await response.blob();
          const file = new File([blob], fileName, { type: 'video/mp4' });

          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({ ...shareDetails, files: [file] });
          } else {
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.style.display = 'none';
              a.href = url;
              a.download = fileName;
              
              document.body.appendChild(a);
              a.click();
              
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
              
              setToastMessage(`¡Video descargado! Súbelo a ${platform} para publicarlo.`);
              setTimeout(() => setToastMessage(null), 4000);
          }
      } catch (error: any) {
          if (error.name !== 'AbortError') {
              console.error(`Error al compartir/descargar el video para ${platform}:`, error);
              setToastMessage('No se pudo compartir o descargar.');
              setTimeout(() => setToastMessage(null), 4000);
          }
      }
  };


  const phoneNumber = "51956382746";
  let message = `Hola, me interesa la siguiente prenda:\n\n`;
  message += `*Producto:* ${garment.title}\n`;
  message += `*Marca:* ${garment.brand}\n`;
  message += `*ID de Producto:* ${garment.id}\n`;
  message += `*Talla:* ${garment.size}\n`;
  message += `*Color:* ${garment.color}\n`;
  if (garment.price) {
    message += `*Precio:* S/ ${garment.price.toFixed(2)}\n`;
  }
  if (garment.slug) {
      const productUrl = `${PUBLIC_URL}/#/${garment.slug}`;
      message += `*Enlace:* ${productUrl}\n`;
  }
  message += `\n¿Podrían darme más información sobre la disponibilidad?`;

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;


  return (
    <div
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 ${isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`relative bg-stone-50 dark:bg-stone-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          onClick={handleClose}
          className="absolute top-4 right-4 text-stone-800 dark:text-stone-200 hover:text-black dark:hover:text-white bg-white/70 dark:bg-stone-700/70 hover:bg-white/90 dark:hover:bg-stone-700/90 backdrop-blur-sm rounded-full p-2 shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-stone-400 z-20"
          aria-label="Cerrar modal"
        >
          <CloseIcon className="w-6 h-6"/>
        </button>
        
        {toastMessage && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-sm font-bold px-4 py-2 rounded-full animate-fade-in-out z-30">
                {toastMessage}
            </div>
        )}

        <div className="flex flex-col md:flex-row flex-grow overflow-y-auto custom-scrollbar">
          <div className="relative w-full md:w-1/2 aspect-[9/16] bg-black flex items-center justify-center flex-shrink-0">
            {garment.videoUrl ? (
              <video
                key={garment.id}
                src={garment.videoUrl}
                autoPlay
                loop
                muted
                controls
                playsInline
                className="w-full h-full object-cover"
              >
                <title>Video de demostración para {garment.title} por {garment.brand}</title>
              </video>
            ) : (
              <SpinnerIcon className="w-10 h-10 text-white animate-spin" />
            )}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col items-center gap-3">
               <button onClick={() => setIsQrModalOpen(true)} className="flex flex-col items-center text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full p-1 group" aria-label="Mostrar código QR">
                <span className="bg-black opacity-50 backdrop-blur-2xl rounded-full p-3 shadow-lg">
                    <QrCodeIcon className="w-6 h-6 text-white" />
                </span>
                <span className="text-xs font-semibold text-white drop-shadow-lg mt-1.5">QR</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleSocialShare('TikTok'); }} className="flex flex-col items-center text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full p-1 group" aria-label="Publicar en TikTok">
                <span className="bg-black opacity-50 backdrop-blur-2xl rounded-full p-3 shadow-lg">
                    <TikTokIcon className="w-6 h-6 text-white" />
                </span>
                <span className="text-xs font-semibold text-white drop-shadow-lg mt-1.5">TikTok</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleSocialShare('Instagram'); }} className="flex flex-col items-center text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full p-1 group" aria-label="Publicar en Instagram">
                <span className="bg-black opacity-50 backdrop-blur-2xl rounded-full p-3 shadow-lg">
                    <InstagramIcon className="w-6 h-6 text-white" />
                </span>
                <span className="text-xs font-semibold text-white drop-shadow-lg mt-1.5">Instagram</span>
              </button>
              <button onClick={handleShare} className="flex flex-col items-center text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full p-1 group" aria-label="Copiar enlace de la prenda">
                <span className="bg-black opacity-50 backdrop-blur-2xl rounded-full p-3 shadow-lg">
                    <ShareIcon className="w-6 h-6 text-white" />
                </span>
                <span className="text-xs font-semibold text-white drop-shadow-lg mt-1.5">Compartir</span>
              </button>
            </div>
          </div>
          
          <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col">
              <div className="flex-shrink-0">
                <p className="text-sm uppercase tracking-widest text-stone-500 dark:text-stone-400">{garment.brand}</p>
                <h2 id="modal-title" className="text-4xl lg:text-5xl font-semibold text-stone-900 dark:text-stone-100 mt-2 mb-4">{garment.title}</h2>
                {garment.price && (
                  <p className="text-3xl text-stone-700 dark:text-stone-200 font-light mb-4">S/ {garment.price.toFixed(2)}</p>
                )}
                 <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 flex-wrap">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center grow sm:grow-0 px-6 py-3 font-semibold text-white bg-green-500 rounded-lg shadow-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <WhatsappIcon className="w-5 h-5 mr-3" />
                      Consultar por WhatsApp
                    </a>
                    <button
                        onClick={handleShare}
                        className="inline-flex items-center justify-center gap-2 grow sm:grow-0 px-6 py-3 font-semibold text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-700 rounded-lg shadow-md border border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-stone-400"
                        aria-label="Copiar enlace de la prenda"
                    >
                        <ShareIcon className="w-5 h-5" />
                        Copiar Enlace
                    </button>
                  </div>
                   {onGenerateArticle && (
                      <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
                          <button
                              onClick={() => onGenerateArticle(garment)}
                              disabled={isGeneratingArticle || articleExists}
                              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-stone-700 dark:text-stone-200 bg-stone-200 dark:bg-stone-700 rounded-lg border border-stone-300 dark:border-stone-600 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-stone-400 disabled:opacity-60 disabled:cursor-not-allowed"
                              title={articleExists ? "Ya existe un artículo para esta prenda." : "Crear un nuevo artículo de blog con IA"}
                          >
                              {isGeneratingArticle ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                              {isGeneratingArticle ? 'Creando artículo...' : (articleExists ? 'Artículo ya Creado' : 'Crear Artículo de Blog')}
                          </button>
                      </div>
                  )}
              </div>
              
              <div className="flex-grow">
                <AccordionItem title="Descripción" isOpen={openAccordion === 'description'} onClick={() => handleAccordionClick('description')}>
                    <p className="leading-relaxed">{garment.description}</p>
                </AccordionItem>
                <AccordionItem title="Detalles del Producto" isOpen={openAccordion === 'details'} onClick={() => handleAccordionClick('details')}>
                    <ul className="space-y-2 list-disc list-inside">
                      {garment.material && <li><strong>Material:</strong> {garment.material}</li>}
                      {garment.occasion && <li><strong>Ocasión Ideal:</strong> {garment.occasion}</li>}
                      {garment.style_notes && <li><strong>Notas de Estilo:</strong> {garment.style_notes}</li>}
                      <li><strong>Color:</strong> {garment.color}</li>
                      <li><strong>Tallas Disponibles:</strong> {garment.size}</li>
                    </ul>
                </AccordionItem>
                <AccordionItem title="Envíos y Devoluciones" isOpen={openAccordion === 'shipping'} onClick={() => handleAccordionClick('shipping')}>
                    <p className="leading-relaxed">Ofrecemos envío express a todo el país (24-48 horas). Devoluciones aceptadas dentro de los 7 días posteriores a la recepción, con la prenda en su estado original.</p>
                </AccordionItem>
              </div>
          </div>
        </div>
        
        <div className="flex justify-center items-center py-1 bg-stone-50 dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700">
          <button
            onClick={() => setIsThumbnailStripVisible(!isThumbnailStripVisible)}
            className="p-1 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-500"
            aria-expanded={isThumbnailStripVisible}
            aria-controls="thumbnail-strip-container"
          >
            <span className="sr-only">{isThumbnailStripVisible ? 'Ocultar miniaturas' : 'Mostrar miniaturas'}</span>
            {isThumbnailStripVisible ? <ChevronUpIcon className="w-6 h-6" /> : <ChevronDownIcon className="w-6 h-6" />}
          </button>
        </div>

        <div 
          id="thumbnail-strip-container"
          className={`transition-all duration-300 ease-in-out overflow-hidden ${isThumbnailStripVisible ? 'max-h-48' : 'max-h-0'}`}>
          <ThumbnailStrip 
            garments={garmentList}
            currentGarment={garment}
            onSelectGarment={onChangeGarment}
          />
        </div>
      </div>
      
      {isQrModalOpen && (
        <QrCodeModal 
            isOpen={isQrModalOpen}
            onClose={() => setIsQrModalOpen(false)}
            garment={garment}
        />
      )}

       <style>{`
        @keyframes backdrop-in { 
          from { opacity: 0; } 
          to { opacity: 1; } 
        }
        @keyframes backdrop-out { 
          from { opacity: 1; } 
          to { opacity: 0; } 
        }
        .animate-backdrop-in { animation: backdrop-in 0.3s ease-out forwards; }
        .animate-backdrop-out { animation: backdrop-out 0.3s ease-out forwards; }

        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes modal-out {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.95) translateY(20px); }
        }
        .animate-modal-in { animation: modal-in 0.3s ease-out forwards; }
        .animate-modal-out { animation: modal-out 0.3s ease-out forwards; }
        
        @keyframes fade-in-out {
            0% { opacity: 0; transform: translateY(10px); }
            20% { opacity: 1; transform: translateY(0); }
            80% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(10px); }
        }
        .animate-fade-in-out { animation: fade-in-out 4s ease-in-out forwards; }
        
        /* Scrollbar styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f5f5f4;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d6d3d1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a29e;
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #292524;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #57534e;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #78716c;
        }
        
        /* Firefox scrollbar */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #d6d3d1 #f5f5f4;
        }
        .dark .custom-scrollbar {
          scrollbar-color: #57534e #292524;
        }
      `}</style>
    </div>
  );
};

export default VideoModal;