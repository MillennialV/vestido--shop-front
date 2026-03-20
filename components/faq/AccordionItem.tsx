import React from 'react';
import { ChevronDownIcon, ChevronUpIcon } from "@/components/ui/Icons";

interface AccordionItemProps {
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onClick: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, isOpen, onClick }) => (
    <div className="border-b border-color-three/10 dark:border-[#2a2a2a]">
        <h2>
            <button
                type="button"
                aria-label={isOpen ? `Cerrar: ${title}` : `Abrir: ${title}`}
                className="flex justify-between items-center w-full py-4 font-semibold text-left text-color-three dark:text-white hover:text-color-one transition-colors"
                onClick={onClick}
                aria-expanded={isOpen}
              >
                <span>{title}</span>
                <span className="text-color-three dark:text-white">
                    {isOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                </span>
            </button>
        </h2>
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
            <div className="py-4 text-color-disable dark:text-[#a0a0a0]">
                {children}
            </div>
        </div>
    </div>
);

export default AccordionItem;