import React, { useState } from 'react';
import { PlusIcon, MinusIcon, EditIcon, DeleteIcon } from './Icons';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
  isAdmin?: boolean;
  onEdit?: (item: FaqItem) => void;
  onDelete?: (item: FaqItem) => void;
}

const FaqAccordion: React.FC<FaqAccordionProps> = ({ items, isAdmin = false, onEdit, onDelete }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  const handleClick = (id: string) => {
    setOpenId(prevId => (prevId === id ? null : id));
  };

  const handleEditClick = (e: React.MouseEvent, item: FaqItem) => {
    e.stopPropagation();
    onEdit?.(item);
  };

  const handleDeleteClick = (e: React.MouseEvent, item: FaqItem) => {
    e.stopPropagation();
    onDelete?.(item);
  };

  return (
    <div className="w-full space-y-2">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id} className="border-b border-stone-200 dark:border-stone-700">
            <h3>
              <button
                onClick={() => handleClick(item.id)}
                className="flex justify-between items-center w-full py-5 text-left font-semibold text-stone-800 dark:text-stone-100 text-lg hover:text-stone-900 dark:hover:text-stone-50 transition-colors"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${item.id}`}
              >
                <span>{item.question}</span>
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {onEdit && (
                        <button
                          onClick={(e) => handleEditClick(e, item)}
                          className="p-1.5 rounded-md hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
                          aria-label="Editar pregunta"
                          title="Editar pregunta"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => handleDeleteClick(e, item)}
                          className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                          aria-label="Eliminar pregunta"
                          title="Eliminar pregunta"
                        >
                          <DeleteIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                  <span className="transition-transform duration-300 text-stone-800 dark:text-stone-200">
                    {isOpen ? <MinusIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
                  </span>
                </div>
              </button>
            </h3>
            <div
              id={`faq-answer-${item.id}`}
              className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
              <div className="overflow-hidden">
                <p className="pb-5 text-stone-600 dark:text-stone-300 leading-relaxed">
                  {item.answer}
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