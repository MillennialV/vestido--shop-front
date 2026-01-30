import React, { useState } from 'react';
import { PlusIcon, MinusIcon } from './Icons';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

const FaqAccordion: React.FC<FaqAccordionProps> = ({ items }) => {
  const [openId, setOpenId] = useState<string | null>(null);

  const handleClick = (id: string) => {
    setOpenId(prevId => (prevId === id ? null : id));
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
                <span className="transition-transform duration-300 text-stone-800 dark:text-stone-200">
                  {isOpen ? <MinusIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
                </span>
              </button>
            </h3>
            <div
              id={`faq-answer-${item.id}`}
              className={`grid transition-all duration-300 ease-in-out ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
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