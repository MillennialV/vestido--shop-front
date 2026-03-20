"use client";

import React, { useState } from "react";
import {
  PlusIcon,
  MinusIcon,
  EditIcon,
  DeleteIcon,
  GripVerticalIcon,
} from "@/components/ui/Icons";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onReorder) return;

    // Copia profunda para evitar mutaciones accidentales
    const reorderedItems = items.map((item) => ({ ...item }));
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    const updatedItems = reorderedItems.map((item: FaqItem, idx) => ({
      ...item,
      id: item.id,
      orden: idx + 1,
    }));

    onReorder(updatedItems);
  };

  if (!isAdmin) {
    return (
      <div className="w-full space-y-2">
        {items.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className="border-b border-color-three/10 dark:border-[#2a2a2a] transition-all duration-300"
            >
              <div className="flex items-center w-full group">
                <h2 className="flex-grow">
                  <button
                    type="button"
                    aria-label={isOpen ? `Cerrar: ${item.pregunta}` : `Abrir: ${item.pregunta}`}
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="flex justify-between items-center w-full py-5 text-left font-semibold text-color-three dark:text-white text-lg"
                  >
                    <span>{item.pregunta}</span>
                  </button>
                </h2>
                <div className="flex items-center gap-3 ml-4">
                  <button
                    type="button"
                    aria-label={isOpen ? `Cerrar: ${item.pregunta}` : `Abrir: ${item.pregunta}`}
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="p-2 cursor-pointer text-color-three dark:text-white"
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
                  <p className="pb-5 text-color-disable dark:text-[#a0a0a0]">
                    {item.respuesta}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="faq-list">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="w-full space-y-2"
          >
            {items.map((item, index) => {
              const isOpen = openId === item.id;
              return (
                <React.Fragment key={String(item.id)}>
                  <Draggable
                    draggableId={item.id}
                    index={index}
                    isDragDisabled={!isAdmin} // Solo el admin puede mover
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`border-b border-color-three/10 dark:border-[#2a2a2a] transition-shadow ${snapshot.isDragging
                          ? "shadow-lg z-50 border-stone-400 dark:border-white"
                          : ""
                          }`}
                      >
                        <div className="flex items-center w-full group">
                          {/* Icono de Arrastre a la izquierda */}
                          {isAdmin && (
                            <div
                              {...provided.dragHandleProps}
                              className="pr-2 cursor-grab active:cursor-grabbing text-color-disable hover:text-color-disable dark:text-[#a0a0a0] dark:hover:text-white"
                              role="button"
                              aria-label={`Reordenar pregunta: ${item.pregunta}`}
                              tabIndex={0}
                            >
                              <GripVerticalIcon className="w-5 h-5" />
                            </div>
                          )}

                          <h2 className="flex-grow">
                            <button
                              type="button"
                              onClick={() => setOpenId(isOpen ? null : item.id)}
                              aria-label={isOpen ? "Cerrar" : "Abrir"}
                              className="flex justify-between items-center w-full py-5 text-left font-fqa-quest dark:text-white"
                            >
                              <span>{item.pregunta}</span>
                            </button>
                          </h2>

                          <div className="flex items-center gap-3 ml-4">
                            {isAdmin && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => onEdit?.(item)}
                                  aria-label="Editar"
                                  className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-[#2a2a2a] text-color-disable dark:text-[#a0a0a0] cursor-pointer"
                                >
                                  <EditIcon className="w-5 h-5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDelete?.(item)}
                                  aria-label="Eliminar"
                                  className="p-1.5 rounded-md hover:bg-red-100 text-red-600 cursor-pointer"
                                >
                                  <DeleteIcon className="w-5 h-5" />
                                </button>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => setOpenId(isOpen ? null : item.id)}
                              aria-label={isOpen ? "Cerrar" : "Abrir"}
                              className="p-2 cursor-pointer dark:text-white"
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
                          className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                        >
                          <div className="overflow-hidden">
                            <p className="pb-5 font-fqa-ans dark:text-[#a0a0a0]">
                              {item.respuesta}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                </React.Fragment>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default FaqAccordion;
