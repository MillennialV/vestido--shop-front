"use client";

import React from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  PlusIcon,
  MinusIcon,
  EditIcon,
  DeleteIcon,
  GripVerticalIcon,
} from "./Icons";

interface FaqItem {
  id: string;
  pregunta: string;
  respuesta: string;
  orden?: number;
}

interface FaqAdminListProps {
  items: FaqItem[];
  openId: string | null;
  setOpenId: (id: string | null) => void;
  onEdit?: (item: FaqItem) => void;
  onDelete?: (item: FaqItem) => void;
  onReorder?: (newItems: FaqItem[]) => void;
}

const FaqAdminList: React.FC<FaqAdminListProps> = ({
  items,
  openId,
  setOpenId,
  onEdit,
  onDelete,
  onReorder,
}) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onReorder) return;

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
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`border-b border-stone-200 dark:border-stone-700 transition-shadow ${snapshot.isDragging
                          ? "shadow-lg z-50 border-stone-400 bg-white dark:bg-stone-800"
                          : ""
                          }`}
                      >
                        <div className="flex items-center w-full group">
                          <div
                            {...provided.dragHandleProps}
                            className="pr-2 cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600"
                            role="button"
                            aria-label={`Reordenar pregunta: ${item.pregunta}`}
                            tabIndex={0}
                          >
                            <GripVerticalIcon className="w-5 h-5" />
                          </div>

                          <h2 className="flex-grow">
                            <button
                              type="button"
                              onClick={() => setOpenId(isOpen ? null : item.id)}
                              aria-label={isOpen ? "Cerrar" : "Abrir"}
                              className="flex justify-between items-center w-full py-5 text-left font-fqa-quest"
                            >
                              <span>{item.pregunta}</span>
                            </button>
                          </h2>

                          <div className="flex items-center gap-3 ml-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => onEdit?.(item)}
                                aria-label="Editar"
                                className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-200 cursor-pointer"
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
                            <button
                              type="button"
                              onClick={() => setOpenId(isOpen ? null : item.id)}
                              aria-label={isOpen ? "Cerrar" : "Abrir"}
                              className="p-2 cursor-pointer"
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
                            <p className="pb-5 font-fqa-ans ">
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

export default FaqAdminList;
