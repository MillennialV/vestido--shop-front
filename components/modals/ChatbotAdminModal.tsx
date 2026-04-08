import React, { useState } from 'react';
import { CloseIcon, PlusIcon, EditIcon, DeleteIcon, CheckIcon, SettingsIcon } from '../ui/Icons';
import ConfirmationModal from './ConfirmationModal';

export interface ChatbotConfig {
    is_enabled: boolean;
    welcome_message: string;
    avatar_url?: string;
}

export interface ChatbotQuestion {
    id: string;
    question_text: string;
    answer_text: string;
    action_type: string;
    action_value: string;
    order: number;
}

interface ChatbotAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: ChatbotConfig;
    questions: ChatbotQuestion[];
    onRefresh: () => Promise<void>;
}

export const ChatbotAdminModal: React.FC<ChatbotAdminModalProps> = ({ isOpen, onClose, config, questions, onRefresh }) => {
    const [activeTab, setActiveTab] = useState<'config' | 'questions'>('config');
    const [editConfig, setEditConfig] = useState<ChatbotConfig>(config);
    const [isSaving, setIsSaving] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Partial<ChatbotQuestion> | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; questionId: string | null; isProcessing: boolean }>({ isOpen: false, questionId: null, isProcessing: false });

    if (!isOpen) return null;

    const handleSaveConfig = async () => {
        setIsSaving(true);
        try {
            await fetch('/api/theme/chatbot-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editConfig)
            });
            await onRefresh();
            alert("Configuración guardada");
        } catch (e) {
            console.error(e);
            alert("Error al guardar configuración");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveQuestion = async () => {
        if (!editingQuestion?.question_text || !editingQuestion?.answer_text) {
            alert("Pregunta y respuesta son requeridas");
            return;
        }
        setIsSaving(true);
        try {
            if (editingQuestion.id) {
                // Update
                await fetch(`/api/theme/chatbot-questions/${editingQuestion.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(editingQuestion)
                });
            } else {
                // Create
                await fetch('/api/theme/chatbot-questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...editingQuestion, order: questions.length })
                });
            }
            await onRefresh();
            setEditingQuestion(null);
        } catch (e) {
            console.error(e);
            alert("Error al guardar pregunta");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteQuestion = async () => {
        if (!deleteConfirmation.questionId) return;
        setDeleteConfirmation(prev => ({ ...prev, isProcessing: true }));
        try {
            await fetch(`/api/theme/chatbot-questions/${deleteConfirmation.questionId}`, { method: 'DELETE' });
            await onRefresh();
            setDeleteConfirmation({ isOpen: false, questionId: null, isProcessing: false });
        } catch (e) {
            console.error(e);
            alert("Error al eliminar pregunta");
            setDeleteConfirmation(prev => ({ ...prev, isProcessing: false }));
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-stone-200 dark:border-[#2a2a2a]">
                    <h2 className="text-xl font-medium text-stone-900 dark:text-white flex items-center gap-2">
                        <SettingsIcon className="w-6 h-6" />
                        Ajustes del Asistente
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-[#2a2a2a] rounded-full text-stone-500 transition-colors">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-stone-200 dark:border-[#2a2a2a] px-6">
                    <button
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'config' ? 'border-primary text-primary' : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
                        onClick={() => setActiveTab('config')}
                    >
                        Configuración
                    </button>
                    <button
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'questions' ? 'border-primary text-primary' : 'border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
                        onClick={() => { setActiveTab('questions'); setEditingQuestion(null); }}
                    >
                        Flujo de Conversación
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'config' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between bg-stone-50 dark:bg-[#2a2a2a] p-4 rounded-xl border border-stone-200 dark:border-stone-700">
                                <div>
                                    <h3 className="font-medium text-stone-900 dark:text-white">Estado del Asistente</h3>
                                    <p className="text-sm text-stone-500 dark:text-stone-400">Activar o desactivar el bot en la tienda</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={editConfig.is_enabled} onChange={(e) => setEditConfig({ ...editConfig, is_enabled: e.target.checked })} />
                                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-stone-600 peer-checked:bg-green-500"></div>
                                </label>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">Mensaje de Bienvenida</label>
                                <textarea
                                    className="w-full border border-stone-200 dark:border-[#2a2a2a] rounded-xl p-3 bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-white focus:ring-2 focus:ring-primary outline-none min-h-[100px]"
                                    value={editConfig.welcome_message}
                                    onChange={(e) => setEditConfig({ ...editConfig, welcome_message: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">Avatar URL (Opcional)</label>
                                <input
                                    type="text"
                                    className="w-full border border-stone-200 dark:border-[#2a2a2a] rounded-xl p-3 bg-white dark:bg-[#1a1a1a] text-stone-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                                    value={editConfig.avatar_url || ''}
                                    placeholder="https://..."
                                    onChange={(e) => setEditConfig({ ...editConfig, avatar_url: e.target.value })}
                                />
                            </div>

                            <button onClick={handleSaveConfig} disabled={isSaving} className="w-full bg-stone-900 dark:bg-white text-white dark:text-stone-900 py-3 rounded-xl font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors disabled:opacity-50">
                                {isSaving ? "Guardando..." : "Guardar Configuración"}
                            </button>
                        </div>
                    )}

                    {activeTab === 'questions' && (
                        <div className="space-y-4">
                            {!editingQuestion ? (
                                <>
                                    <button onClick={() => setEditingQuestion({ question_text: '', answer_text: '', action_type: 'none', action_value: '' })} className="w-full border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-xl py-4 flex items-center justify-center gap-2 text-stone-500 hover:text-stone-900 dark:hover:text-white hover:border-stone-500 hover:bg-stone-50 dark:hover:bg-[#2a2a2a] transition-all">
                                        <PlusIcon className="w-5 h-5" /> Nueva Pregunta
                                    </button>
                                    
                                    <div className="space-y-3 mt-4">
                                        {questions.map((q) => (
                                            <div key={q.id} className="border border-stone-200 dark:border-[#2a2a2a] rounded-xl p-4 flex items-center gap-4 bg-stone-50 dark:bg-[#2a2a2a]/30">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-stone-900 dark:text-white truncate">{q.question_text}</h4>
                                                    <p className="text-sm text-stone-500 truncate">{q.answer_text}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setEditingQuestion(q)} className="p-2 text-stone-500 hover:text-stone-900 dark:hover:text-white bg-white dark:bg-[#1a1a1a] border border-stone-200 dark:border-stone-700 rounded-lg">
                                                        <EditIcon className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setDeleteConfirmation({ isOpen: true, questionId: q.id, isProcessing: false })} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-[#1a1a1a]">
                                                        <DeleteIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4 bg-stone-50 dark:bg-[#2a2a2a]/50 p-6 rounded-2xl border border-stone-200 dark:border-[#2a2a2a]">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Pregunta</label>
                                        <input
                                            type="text"
                                            className="w-full border border-stone-200 dark:border-[#2a2a2a] rounded-xl p-3 bg-white dark:bg-[#1a1a1a] focus:ring-2 focus:ring-primary outline-none"
                                            value={editingQuestion.question_text || ''}
                                            onChange={(e) => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Respuesta</label>
                                        <textarea
                                            className="w-full border border-stone-200 dark:border-[#2a2a2a] rounded-xl p-3 bg-white dark:bg-[#1a1a1a] min-h-[100px] focus:ring-2 focus:ring-primary outline-none"
                                            value={editingQuestion.answer_text || ''}
                                            onChange={(e) => setEditingQuestion({ ...editingQuestion, answer_text: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Tipo de Acción Ext.</label>
                                            <select
                                                className="w-full border border-stone-200 dark:border-[#2a2a2a] rounded-xl p-3 bg-white dark:bg-[#1a1a1a] outline-none"
                                                value={editingQuestion.action_type || 'none'}
                                                onChange={(e) => setEditingQuestion({ ...editingQuestion, action_type: e.target.value })}
                                            >
                                                <option value="none">Ninguna</option>
                                                <option value="url">Abrir Enlace Web</option>
                                                <option value="whatsapp">Contactar WhatsApp</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Valor de Acción</label>
                                            <input
                                                type="text"
                                                className="w-full border border-stone-200 dark:border-[#2a2a2a] rounded-xl p-3 bg-white dark:bg-[#1a1a1a] outline-none disabled:opacity-50"
                                                placeholder={editingQuestion.action_type === 'whatsapp' ? 'Ej. 5199999999' : 'Ej. https://...'}
                                                value={editingQuestion.action_value || ''}
                                                onChange={(e) => setEditingQuestion({ ...editingQuestion, action_value: e.target.value })}
                                                disabled={!editingQuestion.action_type || editingQuestion.action_type === 'none'}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button onClick={() => setEditingQuestion(null)} className="flex-1 py-3 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">Cancelar</button>
                                        <button onClick={handleSaveQuestion} disabled={isSaving} className="flex-1 bg-primary text-white py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                                            {isSaving ? "Guardando..." : <><CheckIcon className="w-5 h-5"/> Guardar Pregunta</>}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={deleteConfirmation.isOpen}
                onClose={() => !deleteConfirmation.isProcessing && setDeleteConfirmation({ isOpen: false, questionId: null, isProcessing: false })}
                onConfirm={handleDeleteQuestion}
                title="Eliminar Pregunta"
                message="¿Estás seguro de que deseas eliminar esta interacción rápida? Esta acción no se puede deshacer."
                isProcessing={deleteConfirmation.isProcessing}
                confirmText="Sí, eliminar"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
};
