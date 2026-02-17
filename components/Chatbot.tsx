"use client";

import React, { useState } from "react";
import { ChatBubbleIcon, CloseIcon, ChevronLeftIcon, WhatsappIcon } from "./Icons";

interface Question {
    id: string;
    text: string;
    answer: React.ReactNode;
}

const QUESTIONS: Question[] = [
    {
        id: "location",
        text: "¿Dónde están ubicados?",
        answer: (
            <span>
                Estamos en <strong>Av. Paz Soldán 255 Oficina A24, San Isidro, Lima</strong>.
                <br />
                <a
                    href="https://maps.google.com/?q=Av.+Paz+Soldán+255+San+Isidro+Lima"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-600 underline text-sm mt-1 block hover:text-stone-900"
                >
                    Ver en mapa
                </a>
            </span>
        ),
    },
    {
        id: "hours",
        text: "¿Cuál es el horario de atención?",
        answer: "Atendemos de Lunes a Sábado de 10am a 8pm.",
    },
    {
        id: "sizes",
        text: "¿Tienen vestidos en talla grande?",
        answer: "Sí, tenemos TODAS las tallas desde XS hasta XXXL en stock.",
    },
    {
        id: "prices",
        text: "¿Cuánto cuestan?",
        answer: "Desde S/160 según marca y diseño.",
    },
    {
        id: "brands",
        text: "¿Qué marcas y modelos tienen?",
        answer: "Contamos con más de 2000 vestidos importados de Los Ángeles, incluyendo marcas como Tommy Hilfiger, Calvin Klein y Ralph Lauren.",
    },
    {
        id: "contact",
        text: "¿Cuál es su número de WhatsApp?",
        answer: (
            <span>
                Puedes escribirnos al <strong>+51 956 382 746</strong> para consultas o pedidos.
            </span>
        )
    }
];

export const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

    const handleClose = () => {
        setIsOpen(false);
        setTimeout(() => {
            setSelectedQuestion(null);
        }, 300);
    };

    const handleOpen = () => {
        setIsOpen(true);
    };

    const handleSelectQuestion = (q: Question) => {
        setSelectedQuestion(q);
    };

    const handleBack = () => {
        setSelectedQuestion(null);
    };

    return (
        <div className="relative z-50 flex flex-col items-end font-sans">
            {/* Messages Area / Chat Window */}
            <div
                className={`
            bg-white rounded-2xl shadow-2xl border border-stone-200 w-[85vw] md:w-80 overflow-hidden mb-4
            absolute bottom-full right-0
            transition-all duration-300 origin-bottom-right pointer-events-auto
            ${isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4 pointer-events-none h-0 mb-0"}
        `}
            >
                {/* Header */}
                <div className="bg-stone-900 text-stone-50 p-4 flex justify-between items-center shadow-md">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <h3 className="font-serif text-lg font-medium tracking-wide">Asistente Virtual</h3>
                    </div>
                    <button onClick={handleClose} className="hover:bg-stone-800 p-1.5 rounded-full transition-colors" aria-label="Cerrar chat">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="bg-stone-50 min-h-[300px] max-h-[50vh] overflow-y-auto custom-scrollbar flex flex-col">
                    {!selectedQuestion ? (
                        <div className="p-4 space-y-3 animate-fade-in-down">
                            <div className="flex gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <span className="text-stone-50 text-xs font-serif">V</span>
                                </div>
                                <div className="bg-white p-3 rounded-tr-lg rounded-br-lg rounded-bl-lg border border-stone-100 text-stone-600 text-sm shadow-sm">
                                    ¡Hola! 👋 Soy el asistente de Vestido.shop. <br />¿En qué puedo ayudarte hoy?
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 pl-2">
                                {QUESTIONS.map((q) => (
                                    <button
                                        key={q.id}
                                        onClick={() => handleSelectQuestion(q)}
                                        className="text-left bg-white p-3 rounded-lg border border-stone-200 text-stone-700 text-sm hover:bg-stone-100 hover:border-stone-300 transition-all shadow-sm active:scale-[0.98]"
                                    >
                                        {q.text}
                                    </button>
                                ))}
                            </div>

                            <div className="pt-2 mt-2 border-t border-stone-200/50">
                                <p className="text-xs text-center text-stone-400 mb-2">¿Prefieres hablar con una persona?</p>
                                <a
                                    href="https://wa.me/51956382746"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 justify-center bg-green-500 text-white p-3 rounded-lg text-sm hover:bg-green-600 transition-all shadow-md active:scale-[0.98] font-medium w-full"
                                >
                                    <WhatsappIcon className="w-5 h-5" />
                                    Hablar con una asesora
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full animate-fade-in-down p-4">
                            <button
                                onClick={handleBack}
                                className="flex items-center text-xs text-stone-500 hover:text-stone-800 transition-colors mb-4 self-start bg-white px-2 py-1 rounded-full border border-stone-200 shadow-sm"
                            >
                                <ChevronLeftIcon className="w-3 h-3 mr-1" />
                                Volver
                            </button>

                            {/* User Question */}
                            <div className="self-end bg-stone-200/50 p-3 rounded-tl-lg rounded-tr-lg rounded-bl-lg text-sm text-stone-800 mb-4 shadow-sm max-w-[85%]">
                                {selectedQuestion.text}
                            </div>

                            {/* Bot Answer */}
                            <div className="flex gap-2 self-start max-w-[90%]">
                                <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                                    <span className="text-stone-50 text-xs font-serif">V</span>
                                </div>
                                <div className="bg-white p-3.5 rounded-tr-lg rounded-br-lg rounded-bl-lg border border-stone-100 text-sm text-stone-600 shadow-sm leading-relaxed">
                                    {selectedQuestion.answer}
                                </div>
                            </div>

                            <div className="mt-auto pt-6">
                                <div className="bg-stone-100 rounded-lg p-3 border border-stone-200">
                                    <p className="text-xs text-stone-500 mb-2 font-medium text-center">¿Necesitas coordinar una cita?</p>
                                    <a
                                        href="https://wa.me/51956382746"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full bg-stone-900 text-white p-2.5 rounded-lg text-sm hover:bg-stone-800 transition-colors shadow-sm"
                                    >
                                        <WhatsappIcon className="w-4 h-4" />
                                        Contactar por WhatsApp
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={isOpen ? handleClose : handleOpen}
                className={`
            bg-stone-900 hover:bg-stone-800 text-white w-12 h-12 md:w-14 md:h-14 rounded-full shadow-2xl transition-all duration-300 pointer-events-auto
            flex items-center justify-center z-50
            ${isOpen ? "rotate-90" : "hover:scale-110 active:scale-95 animate-bounce-subtle"}
        `}
                aria-label={isOpen ? "Cerrar asistente" : "Abrir asistente"}
            >
                {isOpen ? (
                    <CloseIcon className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                    <ChatBubbleIcon className="w-6 h-6 md:w-7 md:h-7" />
                )}
            </button>
        </div>
    );
};
