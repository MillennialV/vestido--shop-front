import React, { useState } from 'react';
import { PlusIcon, MinusIcon, EditIcon, DeleteIcon, GripVerticalIcon } from './Icons';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

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

const FaqAccordion: React.FC<FaqAccordionProps> = ({ items, isAdmin = false, onEdit, onDelete, onReorder }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onReorder) return;

    // Copia profunda para evitar mutaciones accidentales
    const reorderedItems = items.map(item => ({ ...item }));
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    const updatedItems = reorderedItems.map((item: FaqItem, idx) => ({
      ...item,
      id: item.id,
      orden: idx + 1,
    }));

    onReorder(updatedItems, result);
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
                  isDragDisabled={!isAdmin} // Solo el admin puede mover
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 transition-shadow ${
                        snapshot.isDragging ? "shadow-lg z-50 border-stone-400" : ""
                      }`}
                    >
                      <div className="flex items-center w-full group">
                        
                        {/* Icono de Arrastre a la izquierda */}
                        {isAdmin && (
                          <div 
                            {...provided.dragHandleProps} 
                            className="pr-2 cursor-grab active:cursor-grabbing text-stone-400 hover:text-stone-600"
                          >
                            <GripVerticalIcon className="w-5 h-5" />
                          </div>
                        )}

                        <h3 className="flex-grow">
                          <button
                            onClick={() => setOpenId(isOpen ? null : item.id)}
                            className="flex justify-between items-center w-full py-5 text-left font-semibold text-stone-800 dark:text-stone-100 text-lg"
                          >
                            <span>{item.pregunta}</span>
                          </button>
                        </h3>

                        <div className="flex items-center gap-3 ml-4">
                          {isAdmin && (
                            <div className="flex items-center gap-2">
                              <button onClick={() => onEdit?.(item)} className="p-1.5 rounded-md hover:bg-stone-200 text-stone-600">
                                <EditIcon className="w-4 h-4" />
                              </button>
                              <button onClick={() => onDelete?.(item)} className="p-1.5 rounded-md hover:bg-red-100 text-red-600">
                                <DeleteIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          <button onClick={() => setOpenId(isOpen ? null : item.id)} className="p-2">
                            {isOpen ? <MinusIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                          <p className="pb-5 text-stone-600 dark:text-stone-300">{item.respuesta}</p>
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