"use client";

import React, { useEffect, useState } from "react";
import type { Garment } from "@/types/Garment";
import QRCode from "qrcode";
import { PUBLIC_URL } from "@/lib/seo";
import { slugify } from "@/lib/slugify";
import { SpinnerIcon } from "@/components/Icons";

type LabelSize = "58mm" | "80mm" | "50x30mm";

const PrintLabelsPage = () => {
    const [garments, setGarments] = useState<Garment[]>([]);
    const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [labelSize, setLabelSize] = useState<LabelSize>("50x30mm");

    useEffect(() => {
        const storedGarments = sessionStorage.getItem("print-labels-data");
        if (storedGarments) {
            try {
                const parsedGarments = JSON.parse(storedGarments);
                setGarments(parsedGarments);
                generateQRs(parsedGarments);
            } catch (e) {
                console.error("Error al leer datos de etiquetas:", e);
            }
        }
        setLoading(false);
    }, []);

    const generateQRs = async (items: Garment[]) => {
        const codes: Record<string, string> = {};
        for (const item of items) {
            const currentSlug = item.slug || slugify(item.title, item.id);
            const url = `${PUBLIC_URL}/#/${currentSlug}`;
            try {
                // Para etiquetas pequeñas (30mm alto), el QR debe ser más simple (menos margen)
                const qrDataUrl = await QRCode.toDataURL(url, {
                    width: 256,
                    margin: 0, // Sin margen para aprovechar espacio
                    color: {
                        dark: "#000000",
                        light: "#ffffff",
                    },
                });
                codes[item.id] = qrDataUrl;
            } catch (err) {
                console.error(`Error generando QR para ${item.id}`, err);
            }
        }
        setQrCodes(codes);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-stone-50">
                <SpinnerIcon className="w-10 h-10 animate-spin text-stone-500" />
            </div>
        );
    }

    if (garments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-stone-50">
                <h1 className="text-2xl font-bold mb-4 text-stone-800">
                    No hay etiquetas para imprimir
                </h1>
                <p className="mb-4 text-stone-600">
                    Por favor, selecciona las prendas desde el panel de administración.
                </p>
                <button
                    onClick={() => window.close()}
                    className="px-6 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors"
                >
                    Cerrar ventana
                </button>
            </div>
        );
    }

    // Definir estilos según el tamaño
    // 80mm ~ 300px
    // 58mm ~ 218px
    // 50mm ~ 188px
    const getContainerStyle = () => {
        switch (labelSize) {
            case "80mm": return "w-[80mm] min-h-[50px]";
            case "58mm": return "w-[58mm] min-h-[50px]";
            case "50x30mm": return "w-[50mm] h-[30mm] overflow-hidden";
            default: return "w-[80mm]";
        }
    };

    return (
        <div className="min-h-screen bg-stone-100 flex flex-col">
            {/* Controles de visualización (No se imprimen) */}
            <div className="print:hidden sticky top-0 left-0 right-0 bg-white border-b border-stone-200 p-4 flex flex-col sm:flex-row justify-between items-center shadow-sm z-50 gap-4">
                <div>
                    <h1 className="text-lg font-bold text-stone-800">
                        Vista Previa de Etiquetas
                    </h1>
                    <p className="text-sm text-stone-500">
                        {garments.length} etiquetas listas.
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-stone-50 p-2 rounded-lg border border-stone-200 overflow-x-auto">
                    <span className="text-sm font-medium text-stone-600 whitespace-nowrap">Tamaño:</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setLabelSize("50x30mm")}
                            className={`px-3 py-1 text-sm rounded-md transition-colors whitespace-nowrap ${labelSize === "50x30mm" ? "bg-stone-800 text-white" : "bg-white text-stone-600 hover:bg-stone-200"}`}
                        >
                            Etiqueta 50x30mm
                        </button>
                        <button
                            onClick={() => setLabelSize("58mm")}
                            className={`px-3 py-1 text-sm rounded-md transition-colors whitespace-nowrap ${labelSize === "58mm" ? "bg-stone-800 text-white" : "bg-white text-stone-600 hover:bg-stone-200"}`}
                        >
                            Rollo 58mm
                        </button>
                        <button
                            onClick={() => setLabelSize("80mm")}
                            className={`px-3 py-1 text-sm rounded-md transition-colors whitespace-nowrap ${labelSize === "80mm" ? "bg-stone-800 text-white" : "bg-white text-stone-600 hover:bg-stone-200"}`}
                        >
                            Rollo 80mm
                        </button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => window.close()}
                        className="px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50 text-stone-700 font-medium transition-colors"
                    >
                        Cerrar
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-6 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 font-bold flex items-center gap-2 shadow-sm transition-colors"
                    >
                        🖨️ Imprimir
                    </button>
                </div>
            </div>

            {/* Área de impresión */}
            <div className="flex-grow p-8 print:p-0 bg-stone-300 print:bg-white overflow-auto flex flex-col items-center print:block">
                <style jsx global>{`
          @media print {
            @page {
              margin: 0;
              size: auto;
            }
            body {
              background: white;
            }
            .print-hidden {
              display: none !important;
            }
            .ticket-container {
              page-break-after: always; /* Importante para etiquetas */
              break-after: page;
              margin: 0;
              border: none !important;
              box-shadow: none !important;
            }
          }
        `}</style>

                {garments.map((garment, index) => {
                    const isLabel50x30 = labelSize === "50x30mm";

                    return (
                        <div
                            key={`${garment.id}-${index}`}
                            className={`ticket-container bg-white border-2 border-dashed border-stone-200 shadow-sm mb-4 last:mb-0 print:mb-0 flex relative mx-auto ${getContainerStyle()} ${isLabel50x30 ? 'flex-row items-center p-1' : 'flex-col items-center text-center p-2'}`}
                        >
                            {/* DISEÑO PARA ETIQUETA ADHESIVA 50x30mm (Horizontal) */}
                            {isLabel50x30 ? (
                                <>
                                    {/* Izquierda: QR */}
                                    <div className="w-[28mm] h-[28mm] flex-shrink-0 flex items-center justify-center">
                                        {qrCodes[garment.id] ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={qrCodes[garment.id]}
                                                alt="QR"
                                                className="w-full h-full object-contain"
                                                style={{ imageRendering: "pixelated" }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-stone-100" />
                                        )}
                                    </div>

                                    {/* Derecha: Info */}
                                    <div className="flex-grow pl-1 flex flex-col justify-center h-full overflow-hidden leading-none">
                                        <p className="font-bold text-[8px] uppercase truncate w-full mb-0.5">
                                            {garment.brand || "VESTIDO"}
                                        </p>
                                        <h2 className="text-[7px] font-medium leading-tight line-clamp-2 mb-1 w-full">
                                            {garment.title}
                                        </h2>

                                        <div className="flex flex-col items-start gap-0.5 mb-1 w-full">
                                            <span className="text-[7px] font-bold border border-black px-0.5 rounded-[2px] whitespace-nowrap">
                                                T: {garment.size}
                                            </span>
                                            {garment.color && (
                                                <span className="text-[6px] text-stone-600 w-full leading-tight line-clamp-3">
                                                    {garment.color}
                                                </span>
                                            )}
                                        </div>

                                        {garment.price && (
                                            <p className="font-black text-[10px]">
                                                S/ {typeof garment.price === "string"
                                                    ? parseFloat(garment.price).toFixed(0)
                                                    : garment.price.toFixed(0)}
                                            </p>
                                        )}
                                        <p className="text-[6px] text-stone-400 mt-auto">
                                            ID:{garment.id}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                /* DISEÑO PARA ROLLO CONTINUO (Vertical) - 58mm/80mm */
                                <>
                                    <div className="w-full text-center border-b-2 border-dashed border-stone-300 pb-2 mb-2">
                                        <h2 className="font-extrabold text-lg uppercase tracking-wider text-black">
                                            {garment.brand || "VESTIDOS"}
                                        </h2>
                                    </div>
                                    <div className="w-full mb-2">
                                        <h3 className="text-md font-bold text-black leading-tight mb-1">
                                            {garment.title}
                                        </h3>
                                        <div className="flex justify-center gap-2 text-sm">
                                            <span className="bg-black text-white px-2 rounded-sm">{garment.size}</span>
                                            <span className="border border-black px-2 rounded-sm">{garment.color}</span>
                                        </div>
                                    </div>
                                    <div className="w-32 h-32 my-1">
                                        {qrCodes[garment.id] && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={qrCodes[garment.id]} alt="QR" className="w-full h-full object-contain" style={{ imageRendering: "pixelated" }} />
                                        )}
                                    </div>
                                    <div className="w-full mt-2 pt-2 border-t-2 border-dashed border-stone-300">
                                        {garment.price && (
                                            <p className="text-2xl font-black text-black">
                                                S/ {typeof garment.price === "string" ? parseFloat(garment.price).toFixed(2) : garment.price.toFixed(2)}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-stone-500">SKU: {garment.id}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PrintLabelsPage;

