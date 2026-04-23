"use client";

import React, { useState, useEffect, useContext } from "react";
import { ChatBubbleIcon, CloseIcon, ChevronLeftIcon, WhatsappIcon, SettingsIcon } from "@/components/ui/Icons";
import { useRemoteTheme } from "@/context/RemoteThemeContext";
import { AuthContext } from "@/context/AuthContext";
import { ChatbotAdminModal, ChatbotConfig, ChatbotQuestion } from "@/components/modals/ChatbotAdminModal";

export const Chatbot: React.FC = () => {
    const { storeInfo } = useRemoteTheme();
    const auth = useContext(AuthContext);
    const authenticated = auth?.authenticated || false;

    const [isOpen, setIsOpen] = useState(false);
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<ChatbotQuestion | null>(null);

    const [config, setConfig] = useState<ChatbotConfig | null>(null);
    const [questions, setQuestions] = useState<ChatbotQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const hasWhatsapp = !!storeInfo?.whatsapp;
    const whatsappNumber = storeInfo?.whatsapp || "";
    const whatsappUrl = hasWhatsapp ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}` : "";

    const fetchChatbotData = async () => {
        try {
            const res = await fetch('/api/theme/chatbot-config');
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    setConfig(json.data.config);
                    setQuestions(json.data.questions || []);
                }
            }
        } catch (e) {
            console.error("Failed to fetch chatbot config", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchChatbotData();
    }, []);

    if (isLoading) return null;
    
    // Si no hay configuración en la BD y no es admin, no renderiza.
    if (!config && !authenticated) return null;

    // Proveer valores por defecto en caso de que la tabla esté vacía para que el admin pueda editar.
    const safeConfig = config || { 
        is_enabled: false, 
        welcome_message: "¡Hola! ¿En qué puedo ayudarte hoy?",
        avatar_url: ""
    };

    if (!safeConfig.is_enabled && !authenticated) return null;

    const handleClose = () => {
        setIsOpen(false);
        setTimeout(() => {
            setSelectedQuestion(null);
        }, 300);
    };

    const handleOpen = () => {
        setIsOpen(true);
    };

    const handleSelectQuestion = (q: ChatbotQuestion) => {
        setSelectedQuestion(q);
    };

    const handleBack = () => {
        setSelectedQuestion(null);
    };

    // Render action based on action_type
    const renderAction = (question: ChatbotQuestion) => {
        if (!question.action_type || question.action_type === 'none') return null;

        if (question.action_type === 'url') {
            return (
                <a
                    href={question.action_value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-600 dark:text-[#a0a0a0] underline text-sm mt-2 block hover:text-stone-900 dark:hover:text-white"
                >
                    Ver enlace
                </a>
            );
        }

        if (question.action_type === 'whatsapp') {
            const customWa = question.action_value || whatsappUrl;
            return (
                <a
                    href={customWa.startsWith('http') ? customWa : `https://wa.me/${customWa.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 justify-center bg-green-500 text-white p-2 rounded-lg text-xs hover:bg-green-600 transition-all shadow-md mt-3 font-medium w-full max-w-[200px]"
                >
                    <WhatsappIcon className="w-4 h-4" />
                    Contactar
                </a>
            );
        }

        return null;
    };

    return (
        <>
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none font-sans">
            {/* Messages Area / Chat Window */}
            <div
                className={`
            bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-stone-200 dark:border-[#2a2a2a] w-[85vw] md:w-80 overflow-hidden mb-4
            transition-all duration-300 origin-bottom-right pointer-events-auto
            ${isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4 pointer-events-none h-0 mb-0"}
        `}
            >
                {/* Header */}
                <div className="bg-color-one text-color-four p-4 flex justify-between items-center shadow-md">
                    <div className="flex items-center gap-2">
                        {safeConfig.is_enabled ? (
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Bot Activo"></div>
                        ) : (
                            <div className="w-2 h-2 rounded-full bg-red-500" title="Bot Inactivo (Visible Solo Admin)"></div>
                        )}
                        <h3 className="font-serif text-lg font-medium tracking-wide">Asistente Virtual</h3>
                    </div>
                    <div className="flex gap-1 items-center">
                        {authenticated && (
                            <button onClick={() => setIsConfigOpen(true)} className="p-1.5 hover:bg-stone-800 dark:hover:bg-stone-200 rounded-full text-stone-300 dark:text-stone-700 hover:text-white dark:hover:text-black transition-colors" title="Configurar Chatbot">
                                <SettingsIcon className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={handleClose} className="hover:bg-black/10 dark:hover:bg-white/10 p-1.5 rounded-full transition-colors" aria-label="Cerrar chat">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-stone-50 dark:bg-[#0f0f0f] min-h-[300px] max-h-[50vh] overflow-y-auto custom-scrollbar flex flex-col">
                    {!selectedQuestion ? (
                        <div className="p-4 space-y-3 animate-fade-in-down">
                            <div className="flex gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-color-one flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                                    {safeConfig.avatar_url ? (
                                        <img src={safeConfig.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-color-four text-xs font-serif">V</span>
                                    )}
                                </div>
                                <div className="bg-white dark:bg-[#1a1a1a] p-3 rounded-tr-lg rounded-br-lg rounded-bl-lg border border-stone-100 dark:border-[#2a2a2a] text-stone-600 dark:text-[#a0a0a0] text-sm shadow-sm">
                                    {safeConfig.welcome_message.split('\\n').map((line: string, i: number) => (
                                        <React.Fragment key={i}>
                                            {line}
                                            {i < safeConfig.welcome_message.split('\\n').length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 pl-2">
                                {questions
                                    .filter(q => q.action_type !== 'whatsapp' || hasWhatsapp)
                                    .map((q) => (
                                    <button
                                        key={q.id}
                                        onClick={() => handleSelectQuestion(q)}
                                        className="text-left bg-white dark:bg-[#1a1a1a] p-3 rounded-lg border border-stone-200 dark:border-[#2a2a2a] text-stone-700 dark:text-white text-sm hover:bg-stone-100 dark:hover:bg-[#2a2a2a] transition-all shadow-sm active:scale-[0.98]"
                                    >
                                        {q.question_text}
                                    </button>
                                ))}
                            </div>

                            {hasWhatsapp && (
                                <div className="pt-2 mt-2 border-t border-stone-200/50 dark:border-[#2a2a2a]">
                                    <p className="text-xs text-center text-stone-400 dark:text-[#a0a0a0]/60 mb-2">¿Prefieres hablar con una persona?</p>
                                    <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 justify-center bg-green-500 text-white p-3 rounded-lg text-sm hover:bg-green-600 transition-all shadow-md active:scale-[0.98] font-medium w-full"
                                    >
                                        <WhatsappIcon className="w-5 h-5" />
                                        Hablar con una asesora
                                    </a>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col h-full animate-fade-in-down p-4">
                            <button
                                onClick={handleBack}
                                className="flex items-center text-xs text-stone-500 dark:text-[#a0a0a0] hover:text-stone-800 dark:hover:text-white transition-colors mb-4 self-start bg-white dark:bg-[#1a1a1a] px-2 py-1 rounded-full border border-stone-200 dark:border-[#2a2a2a] shadow-sm"
                            >
                                <ChevronLeftIcon className="w-3 h-3 mr-1" />
                                Volver
                            </button>

                            {/* User Question */}
                            <div className="self-end bg-stone-200/50 dark:bg-[#2a2a2a] p-3 rounded-tl-lg rounded-tr-lg rounded-bl-lg text-sm text-stone-800 dark:text-white mb-4 shadow-sm max-w-[85%]">
                                {selectedQuestion.question_text}
                            </div>

                            {/* Bot Answer */}
                            <div className="flex gap-2 self-start max-w-[90%]">
                                <div className="w-8 h-8 rounded-full bg-color-one flex items-center justify-center flex-shrink-0 shadow-sm mt-1 overflow-hidden">
                                     {safeConfig.avatar_url ? (
                                        <img src={safeConfig.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-color-four text-xs font-serif">V</span>
                                    )}
                                </div>
                                <div className="bg-white dark:bg-[#1a1a1a] p-3.5 rounded-tr-lg rounded-br-lg rounded-bl-lg border border-stone-100 dark:border-[#2a2a2a] text-sm text-stone-600 dark:text-[#a0a0a0] shadow-sm leading-relaxed">
                                    {selectedQuestion.answer_text.split('\\n').map((line: string, i: number) => (
                                        <React.Fragment key={i}>
                                            {line}
                                            {i < selectedQuestion.answer_text.split('\\n').length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                    {renderAction(selectedQuestion)}
                                </div>
                            </div>

                            {hasWhatsapp && (
                                <div className="mt-auto pt-6">
                                    <div className="bg-stone-100 dark:bg-[#0f0f0f] rounded-lg p-3 border border-stone-200 dark:border-[#2a2a2a]">
                                        <p className="text-xs text-stone-500 dark:text-[#a0a0a0] mb-2 font-medium text-center">¿Necesitas coordinar una cita?</p>
                                        <a
                                            href={whatsappUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full bg-color-one text-color-four p-2.5 rounded-lg text-sm hover:opacity-90 transition-colors shadow-sm"
                                        >
                                            <WhatsappIcon className="w-4 h-4" />
                                            Contactar por WhatsApp
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={isOpen ? handleClose : handleOpen}
                className={`
            bg-color-one hover:opacity-90 text-color-four w-12 h-12 md:w-14 md:h-14 rounded-full shadow-2xl transition-all duration-300 pointer-events-auto
            flex items-center justify-center z-50 relative
            ${isOpen ? "rotate-90" : "hover:scale-110 active:scale-95 animate-bounce-subtle"}
        `}
                aria-label={isOpen ? "Cerrar asistente" : "Abrir asistente"}
            >
                {!safeConfig.is_enabled && authenticated && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-[#1a1a1a]"></span>
                )}
                {isOpen ? (
                    <CloseIcon className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                    <ChatBubbleIcon className="w-6 h-6 md:w-7 md:h-7" />
                )}
            </button>
        </div>

        {/* Admin Editor Modal: rendered OUTSIDE the pointer-events-none wrapper */}
        {authenticated && (
            <ChatbotAdminModal
                isOpen={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
                config={safeConfig}
                questions={questions}
                onRefresh={fetchChatbotData}
            />
        )}
        </>
    );
};

