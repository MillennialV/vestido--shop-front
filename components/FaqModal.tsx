/**
 * Componente modal reutilizable para gestionar preguntas frecuentes (FAQ)
 * 
 * Soporta tres modos de operación:
 * - create: Crear nueva pregunta (solo pregunta y respuesta, estado "activa" automático)
 * - edit: Editar pregunta existente (solo pregunta y respuesta)
 * - delete: Eliminar pregunta con confirmación
 * 
 * Características:
 * - Validación de campos con mensajes de error específicos por campo
 * - Manejo de errores HTTP (401, 404, 422, 500)
 * - Estados de carga durante operaciones
 * - Limpieza automática de errores al escribir
 */

import React, { useState, useEffect, useRef } from 'react';
import { preguntasService, PreguntasServiceError } from '../services/faqService';
import type { FaqItem } from '@/types/FaqItem';
import { CloseIcon, SpinnerIcon, ExclamationTriangleIcon } from './Icons';

type FaqModalMode = 'create' | 'edit' | 'delete';

interface FaqModalProps {
    mode: FaqModalMode;
    faq?: FaqItem | null;
    onClose: () => void;
    onSuccess: () => void;
}

interface ValidationError {
    field: string;
    message: string;
}

const FaqModal: React.FC<FaqModalProps> = ({ mode, faq, onClose, onSuccess }) => {
    const [pregunta, setPregunta] = useState('');
    const [respuesta, setRespuesta] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const preguntaRef = useRef<HTMLInputElement>(null);
    const respuestaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (mode === 'edit' && faq) {
            setPregunta(faq.pregunta);
            setRespuesta(faq.respuesta);
        } else {
            setPregunta('');
            setRespuesta('');
        }
        setError(null);
        setFieldErrors({});
    }, [mode, faq]);

    useEffect(() => {
        if (mode === 'create' || mode === 'edit') {
            preguntaRef.current?.focus();
        }
    }, [mode]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isLoading) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, isLoading]);

    /**
     * Parsea los errores de validación del backend a un formato estructurado
     * Soporta múltiples formatos de respuesta del servidor
     */
    const parseValidationErrors = (errorData: any): Record<string, string> => {
        const errors: Record<string, string> = {};

        if (Array.isArray(errorData)) {
            errorData.forEach((err: ValidationError) => {
                if (err.field && err.message) {
                    errors[err.field] = err.message;
                }
            });
        } else if (errorData.errors && Array.isArray(errorData.errors)) {
            errorData.errors.forEach((err: ValidationError) => {
                if (err.field && err.message) {
                    errors[err.field] = err.message;
                }
            });
        } else if (errorData.validation) {
            Object.keys(errorData.validation).forEach((field) => {
                errors[field] = errorData.validation[field];
            });
        }

        return errors;
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pregunta.trim() || !respuesta.trim()) {
            setError('Por favor completa todos los campos');
            return;
        }

        setIsLoading(true);
        setError(null);
        setFieldErrors({});

        try {
            await preguntasService.crearPregunta({
                pregunta: pregunta.trim(),
                respuesta: respuesta.trim(),
                estado: 'activa',
            });
            onSuccess();
            onClose();
        } catch (err) {
            if (err instanceof PreguntasServiceError) {
                if (err.statusCode === 401) {
                    setError('No estás autenticado. Inicia sesión primero.');
                } else if (err.statusCode === 422) {
                    const validationErrors = parseValidationErrors(err.originalError);
                    if (Object.keys(validationErrors).length > 0) {
                        setFieldErrors(validationErrors);
                        setError('Por favor corrige los errores en el formulario');
                    } else {
                        setError('Error de validación. Verifica los datos ingresados.');
                    }
                } else {
                    setError(err.message || 'Error al crear la pregunta');
                }
            } else {
                setError('Error desconocido al crear la pregunta');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!faq || !pregunta.trim() || !respuesta.trim()) {
            setError('Por favor completa todos los campos');
            return;
        }

        setIsLoading(true);
        setError(null);
        setFieldErrors({});

        try {
            await preguntasService.actualizarPregunta(faq.id, {
                pregunta: pregunta.trim(),
                respuesta: respuesta.trim(),
            });
            onSuccess();
            onClose();
        } catch (err) {
            if (err instanceof PreguntasServiceError) {
                if (err.statusCode === 401) {
                    setError('No estás autenticado. Inicia sesión primero.');
                } else if (err.statusCode === 404) {
                    setError('La pregunta no existe');
                } else if (err.statusCode === 422) {
                    const validationErrors = parseValidationErrors(err.originalError);
                    if (Object.keys(validationErrors).length > 0) {
                        setFieldErrors(validationErrors);
                        setError('Por favor corrige los errores en el formulario');
                    } else {
                        setError('Error de validación. Verifica los datos ingresados.');
                    }
                } else {
                    setError(err.message || 'Error al actualizar la pregunta');
                }
            } else {
                setError('Error desconocido al actualizar la pregunta');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!faq) return;

        setIsLoading(true);
        setError(null);

        try {
            await preguntasService.eliminarPregunta(faq.id);
            onSuccess();
            onClose();
        } catch (err) {
            if (err instanceof PreguntasServiceError) {
                if (err.statusCode === 401) {
                    setError('No estás autenticado. Inicia sesión primero.');
                } else if (err.statusCode === 404) {
                    setError('La pregunta no existe');
                } else {
                    setError(err.message || 'Error al eliminar la pregunta');
                }
            } else {
                setError('Error desconocido al eliminar la pregunta');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const getTitle = () => {
        switch (mode) {
            case 'create':
                return 'Agregar Pregunta';
            case 'edit':
                return 'Editar Pregunta';
            case 'delete':
                return 'Eliminar Pregunta';
            default:
                return '';
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={!isLoading ? onClose : undefined}
            role="dialog"
            aria-modal="true"
            aria-labelledby="faq-modal-title"
        >
            <div
                className="relative bg-stone-50 dark:bg-stone-800 rounded-lg shadow-2xl w-full max-w-lg animate-modal-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`p-8 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h2 id="faq-modal-title" className="text-2xl font-semibold text-stone-900 dark:text-stone-100 mb-6">
                        {getTitle()}
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md">
                            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                        </div>
                    )}

                    {mode === 'delete' ? (
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-stone-700 dark:text-stone-200 mb-2">
                                        ¿Estás seguro de que quieres eliminar esta pregunta?
                                    </p>
                                    {faq && (
                                        <div className="bg-stone-100 dark:bg-stone-700 p-4 rounded-md">
                                            <p className="font-semibold text-stone-900 dark:text-stone-100 mb-2">
                                                {faq.pregunta}
                                            </p>
                                            <p className="text-sm text-stone-600 dark:text-stone-300 line-clamp-2">
                                                {faq.respuesta}
                                            </p>
                                        </div>
                                    )}
                                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-3">
                                        Esta acción no se puede deshacer.
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-medium py-2.5 px-6 rounded-lg border border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isLoading}
                                    className="bg-red-600 dark:bg-red-700 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <SpinnerIcon className="w-4 h-4 animate-spin" />
                                            Eliminando...
                                        </>
                                    ) : (
                                        'Eliminar'
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={mode === 'create' ? handleCreate : handleEdit} className="space-y-4">
                            <div>
                                <label htmlFor="pregunta" className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                                    Pregunta
                                </label>
                                <input
                                    ref={preguntaRef}
                                    type="text"
                                    id="pregunta"
                                    value={pregunta}
                                    onChange={(e) => {
                                        setPregunta(e.target.value);
                                        if (fieldErrors.pregunta) {
                                            setFieldErrors(prev => {
                                                const newErrors = { ...prev };
                                                delete newErrors.pregunta;
                                                return newErrors;
                                            });
                                        }
                                    }}
                                    required
                                    disabled={isLoading}
                                    className={`w-full p-3 border rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 text-base bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 disabled:opacity-50 disabled:cursor-not-allowed ${fieldErrors.pregunta
                                        ? 'border-red-500 dark:border-red-500'
                                        : 'border-stone-300 dark:border-stone-600'
                                        }`}
                                    placeholder="Ej: ¿Cómo puedo saber cuál es mi talla correcta?"
                                />
                                {fieldErrors.pregunta && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {fieldErrors.pregunta}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="respuesta" className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-2">
                                    Respuesta
                                </label>
                                <textarea
                                    ref={respuestaRef}
                                    id="respuesta"
                                    value={respuesta}
                                    onChange={(e) => {
                                        setRespuesta(e.target.value);
                                        if (fieldErrors.respuesta) {
                                            setFieldErrors(prev => {
                                                const newErrors = { ...prev };
                                                delete newErrors.respuesta;
                                                return newErrors;
                                            });
                                        }
                                    }}
                                    required
                                    disabled={isLoading}
                                    rows={5}
                                    className={`w-full p-3 border rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 text-base bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 disabled:opacity-50 disabled:cursor-not-allowed resize-y ${fieldErrors.respuesta
                                        ? 'border-red-500 dark:border-red-500'
                                        : 'border-stone-300 dark:border-stone-600'
                                        }`}
                                    placeholder="Escribe la respuesta a la pregunta..."
                                />
                                {fieldErrors.respuesta && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {fieldErrors.respuesta}
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-medium py-2.5 px-6 rounded-lg border border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-stone-800 dark:bg-stone-700 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <SpinnerIcon className="w-4 h-4 animate-spin" />
                                            {mode === 'create' ? 'Creando...' : 'Guardando...'}
                                        </>
                                    ) : (
                                        mode === 'create' ? 'Crear' : 'Guardar'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
                {!isLoading && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 z-10 transition-colors rounded-full focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-stone-400"
                        aria-label="Cerrar"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                )}
                {isLoading && (
                    <div className="absolute inset-0 bg-stone-50/95 dark:bg-stone-800/95 rounded-lg flex items-center justify-center z-20">
                        <div className="flex flex-col items-center gap-4">
                            <SpinnerIcon className="w-12 h-12 text-stone-800 dark:text-stone-200 animate-spin" />
                            <p className="text-stone-700 dark:text-stone-200 font-medium text-lg">
                                {mode === 'create' ? 'Creando pregunta...' : mode === 'edit' ? 'Guardando cambios...' : 'Eliminando pregunta...'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
            <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-modal-in { animation: modal-in 0.3s ease-out forwards; }
      `}</style>
        </div>
    );
};

export default FaqModal;

