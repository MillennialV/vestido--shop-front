import React from 'react';
import ConfirmationModal from "@/components/modals/ConfirmationModal";

interface DownloadAllModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isDownloading: boolean;
}

const DownloadAllModal: React.FC<DownloadAllModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isDownloading
}) => {
    return (
        <ConfirmationModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Descargar Catálogo"
            message={
                <div className="space-y-3">
                    <p className="font-p-modal">
                        Estás por descargar todas las imágenes del catálogo en un archivo ZIP.
                    </p>
                </div>
            }
            confirmText={isDownloading ? "Procesando..." : "Descargar"}
            cancelText="Cancelar"
            variant="info"
            isProcessing={isDownloading}
        />
    );
};

export default DownloadAllModal;
