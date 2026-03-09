import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  PlusIcon,
  MinusIcon,
} from "./Icons";

// Importación dinámica del componente de administración (contiene la librería pesada dnd)
const FaqAdminList = dynamic(() => import("./FaqAdminList"), { 
  ssr: false,
  loading: () => <div className="p-4 text-center animate-pulse">Cargando herramientas de administración...</div>
});

interface FaqItem {
  id: string;
  pregunta: string;
  respuesta: string;
  orden?: number;
}

interface FaqAccordionProps {
  items: FaqItem[];
  isAdmin?: boolean;
  onEdit?: (item: FaqItem) => void;
  onDelete?: (item: FaqItem) => void;
  onReorder?: (newItems: FaqItem[]) => void;
}

const FaqAccordion: React.FC<FaqAccordionProps> = ({
  items,
  isAdmin = false,
  onEdit,
  onDelete,
  onReorder,
}) => {
  const [openId, setOpenId] = useState<string | null>(null);

  if (isAdmin) {
    return (
      <FaqAdminList 
        items={items}
        openId={openId}
        setOpenId={setOpenId}
        onEdit={onEdit}
        onDelete={onDelete}
        onReorder={onReorder}
      />
    );
  }

  return (
    <div className="w-full space-y-2">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className="border-b border-stone-200 dark:border-stone-700 transition-all duration-300"
          >
            <div className="flex items-center w-full group">
              <h2 className="flex-grow">
                <button
                  type="button"
                  aria-label={isOpen ? `Cerrar: ${item.pregunta}` : `Abrir: ${item.pregunta}`}
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="flex justify-between items-center w-full py-5 text-left font-fqa-quest"
                >
                  <span>{item.pregunta}</span>
                </button>
              </h2>
              <div className="flex items-center gap-3 ml-4">
                <button
                  type="button"
                  aria-label={isOpen ? `Cerrar: ${item.pregunta}` : `Abrir: ${item.pregunta}`}
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="p-2 cursor-pointer text-color-two dark:text-color-four"
                >
                  {isOpen ? (
                    <MinusIcon className="w-6 h-6" />
                  ) : (
                    <PlusIcon className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            <div
              className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
            >
              <div className="overflow-hidden">
                <p className="pb-5 font-fqa-ans">
                  {item.respuesta}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FaqAccordion;
