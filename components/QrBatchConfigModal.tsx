import React, { useState } from "react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import type { Garment } from "@/types/Garment";
import { CloseIcon, DownloadIcon } from "./Icons";
import { PUBLIC_URL } from "@/lib/seo";
import { slugify } from "@/lib/slugify";

interface QrBatchConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    garments: Garment[];
}

interface SelectedFields {
    title: boolean;
    brand: boolean;
    price: boolean;
    size: boolean;
    color: boolean;
    sku: boolean;
}

const QrBatchConfigModal: React.FC<QrBatchConfigModalProps> = ({
    isOpen,
    onClose,
    garments,
}) => {
    const [selectedFields, setSelectedFields] = useState<SelectedFields>({
        title: true,
        brand: true,
        price: true,
        size: true,
        color: true,
        sku: true,
    });
    const [isGenerating, setIsGenerating] = useState(false);

    const handleFieldToggle = (field: keyof SelectedFields) => {
        setSelectedFields((prev) => ({ ...prev, [field]: !prev[field] }));
    };

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 10;
            const cols = 3;
            const rows = 3;
            const itemWidth = (pageWidth - margin * 2) / cols;
            const itemHeight = (pageHeight - margin * 2) / rows;
            const qrSize = 35; // mm

            let x = margin;
            let y = margin;
            let col = 0;
            let row = 0;

            for (let i = 0; i < garments.length; i++) {
                const garment = garments[i];

                // Check if we need a new page
                if (i > 0 && i % (cols * rows) === 0) {
                    doc.addPage();
                    x = margin;
                    y = margin;
                    col = 0;
                    row = 0;
                }

                // Draw item border (optional, helpful for cutting)
                doc.setDrawColor(200);
                doc.rect(x + 2, y + 2, itemWidth - 4, itemHeight - 4);

                // Generate QR
                const currentSlug = garment.slug || slugify(garment.title, garment.id);
                const url = `${PUBLIC_URL}/#/${currentSlug}`;

                try {
                    const qrDataUrl = await QRCode.toDataURL(url, {
                        errorCorrectionLevel: 'M',
                        margin: 1,
                        width: 200,
                        color: {
                            dark: '#000000',
                            light: '#ffffff'
                        }
                    });

                    // Add QR Image centered horizontally in item box
                    const qrX = x + (itemWidth - qrSize) / 2;
                    const qrY = y + 5;
                    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

                    // Add Text below QR
                    let textY = qrY + qrSize + 6; // Little more space
                    doc.setFontSize(9);
                    doc.setTextColor(0, 0, 0);

                    // Add padding to text area
                    const textPadding = 4;
                    const startTextX = x + textPadding;
                    const textMaxWidth = itemWidth - (textPadding * 2);

                    // Helper to add multiline text safely
                    const addWrappedText = (text: string, isBold: boolean = false) => {
                        doc.setFont("helvetica", isBold ? "bold" : "normal");
                        const lines = doc.splitTextToSize(text, textMaxWidth);
                        doc.text(lines, startTextX, textY);
                        // Increment Y based on number of lines (approx 4mm per line for fontsize 9)
                        textY += lines.length * 4;
                    };

                    if (selectedFields.title) {
                        // Limit title to 2 lines max to save space, or let it wrap fully? 
                        // Let's wrap fully but be mindful of space.
                        addWrappedText(garment.title, true);
                        textY += 1; // small gap
                    }

                    if (selectedFields.brand) {
                        doc.setFontSize(8);
                        addWrappedText(garment.brand, false);
                        textY += 1;
                    }

                    if (selectedFields.price && garment.price) {
                        const priceVal = typeof garment.price === 'string' ? parseFloat(garment.price) : garment.price;
                        doc.setFontSize(9);
                        addWrappedText(`S/ ${priceVal.toFixed(2)}`, true);
                        textY += 1;
                    }

                    // Combine Size and Color nicely
                    let details = [];
                    if (selectedFields.size) details.push(`Talla: ${garment.size}`);
                    if (selectedFields.color) details.push(`Color: ${garment.color}`);

                    if (details.length > 0) {
                        doc.setFontSize(8);
                        addWrappedText(details.join(" | "), false);
                        textY += 1;
                    }

                    if (selectedFields.sku) {
                        doc.setFontSize(7);
                        doc.setTextColor(100);
                        // Avoid wrapping ID if possible, but allow it if really long
                        addWrappedText(`ID: ${garment.id} | SKU: ${garment.id.toString().padStart(6, '0')}`, false);
                    }

                } catch (err) {
                    console.error(`Error generating QR for garment ${garment.id}:`, err);
                    doc.text("Error QR", x + 10, y + 20);
                }

                // Update position for next item
                col++;
                x += itemWidth;
                if (col >= cols) {
                    col = 0;
                    x = margin;
                    row++;
                    y += itemHeight;
                }
            }

            doc.save("catalogo-qr.pdf");
            onClose();
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Hubo un error al generar el PDF.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-stone-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-stone-200 dark:border-stone-700 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
                        Generar Catálogo QR
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-stone-600 dark:text-stone-300 mb-4">
                        Has seleccionado {garments.length} prendas. Selecciona qué información deseas mostrar junto al código QR en el PDF:
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedFields.title}
                                onChange={() => handleFieldToggle('title')}
                                className="rounded border-stone-300 text-sky-600 shadow-sm focus:border-sky-300 focus:ring focus:ring-sky-200 focus:ring-opacity-50"
                            />
                            <span className="text-stone-700 dark:text-stone-300">Título</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedFields.brand}
                                onChange={() => handleFieldToggle('brand')}
                                className="rounded border-stone-300 text-sky-600 shadow-sm focus:border-sky-300 focus:ring focus:ring-sky-200 focus:ring-opacity-50"
                            />
                            <span className="text-stone-700 dark:text-stone-300">Marca</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedFields.price}
                                onChange={() => handleFieldToggle('price')}
                                className="rounded border-stone-300 text-sky-600 shadow-sm focus:border-sky-300 focus:ring focus:ring-sky-200 focus:ring-opacity-50"
                            />
                            <span className="text-stone-700 dark:text-stone-300">Precio</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedFields.size}
                                onChange={() => handleFieldToggle('size')}
                                className="rounded border-stone-300 text-sky-600 shadow-sm focus:border-sky-300 focus:ring focus:ring-sky-200 focus:ring-opacity-50"
                            />
                            <span className="text-stone-700 dark:text-stone-300">Talla</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedFields.color}
                                onChange={() => handleFieldToggle('color')}
                                className="rounded border-stone-300 text-sky-600 shadow-sm focus:border-sky-300 focus:ring focus:ring-sky-200 focus:ring-opacity-50"
                            />
                            <span className="text-stone-700 dark:text-stone-300">Color</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedFields.sku}
                                onChange={() => handleFieldToggle('sku')}
                                className="rounded border-stone-300 text-sky-600 shadow-sm focus:border-sky-300 focus:ring focus:ring-sky-200 focus:ring-opacity-50"
                            />
                            <span className="text-stone-700 dark:text-stone-300">SKU / ID</span>
                        </label>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg flex items-start gap-3">
                        <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full">
                            <DownloadIcon className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div>
                            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">Formato de Impresión</p>
                            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                                El PDF se generará en formato A4 con una cuadrícula de 3x3 etiquetas por página. Ideal para imprimir y recortar.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-stone-200 dark:border-stone-700 flex justify-end gap-3 bg-stone-50 dark:bg-stone-900/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                        disabled={isGenerating}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={generatePDF}
                        disabled={isGenerating || garments.length === 0}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors ${isGenerating || garments.length === 0
                            ? "bg-stone-400 cursor-not-allowed"
                            : "bg-stone-800 hover:bg-stone-700 dark:bg-stone-600 dark:hover:bg-stone-500"
                            }`}
                    >
                        {isGenerating ? (
                            <>Generando...</>
                        ) : (
                            <>
                                <DownloadIcon className="w-5 h-5" />
                                Descargar PDF
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QrBatchConfigModal;
