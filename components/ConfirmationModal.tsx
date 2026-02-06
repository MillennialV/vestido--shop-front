import React from 'react';
import { CloseIcon, SpinnerIcon, ExclamationTriangleIcon } from './Icons';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    isProcessing?: boolean;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    isProcessing = false,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger'
}) => {
    const [isRendered, setIsRendered] = React.useState(false);
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            // Pequeño delay para asegurar que el DOM existe antes de animar entrada
            setTimeout(() => setIsVisible(true), 10);
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setIsRendered(false), 300); // Mismo tiempo que la animación
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isRendered) return null;

    const bgColors = {
        danger: 'bg-red-600 hover:bg-red-700',
        warning: 'bg-yellow-500 hover:bg-yellow-600',
        info: 'bg-stone-800 hover:bg-stone-700'
    };

    const iconColors = {
        danger: 'text-red-600 bg-red-100 dark:bg-red-900/30',
        warning: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
        info: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
    };

    return (
        <div
            className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={!isProcessing ? onClose : undefined}
            role="dialog"
            aria-modal="true"
        >
            <div
                className={`relative bg-white dark:bg-stone-800 rounded-lg shadow-2xl w-full max-w-md overflow-hidden transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full shrink-0 ${iconColors[variant]}`}>
                            <ExclamationTriangleIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-100 mb-2">
                                {title}
                            </h3>
                            <div className="text-stone-600 dark:text-stone-300 leading-relaxed">
                                {message}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="px-4 py-2 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors font-medium disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isProcessing}
                            className={`px-4 py-2 text-white rounded-lg transition-colors font-medium shadow-md flex items-center gap-2 disabled:opacity-50 ${bgColors[variant]}`}
                        >
                            {isProcessing && <SpinnerIcon className="w-4 h-4 animate-spin" />}
                            {confirmText}
                        </button>
                    </div>
                </div>

                {!isProcessing && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                )}
            </div>

        </div>
    );
};

export default ConfirmationModal;
