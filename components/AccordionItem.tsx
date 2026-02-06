import React from 'react';
import { ChevronDownIcon, ChevronUpIcon } from './Icons';

interface AccordionItemProps {
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onClick: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, isOpen, onClick }) => (
    <div className="border-b border-stone-200 dark:border-stone-700">
        <h2>
            <button
                type="button"
                aria-label={isOpen ? `Cerrar: ${title}` : `Abrir: ${title}`}
                className="flex justify-between items-center w-full py-4 font-semibold text-left text-stone-800 dark:text-stone-100 hover:text-stone-900 dark:hover:text-stone-50 transition-colors"
                onClick={onClick}
                aria-expanded={isOpen}
            >
                <span>{title}</span>
                <span className="text-stone-800 dark:text-stone-200">
                    {isOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                </span>
            </button>
        </h2>
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
            <div className="py-4 text-stone-600 dark:text-stone-300">
                {children}
            </div>
        </div>
    </div>
);

export default AccordionItem;