"use client";

import React from "react";
import Link from "next/link";
import { FacebookIcon, InstagramIcon, WhatsappIcon } from "@/components/ui/Icons";
import { useRemoteTheme } from "@/context/RemoteThemeContext";

const SiteFooter: React.FC = () => {
    const { storeInfo } = useRemoteTheme();
    const currentYear = new Date().getFullYear();

    const facebookUrl = storeInfo?.facebook_url;
    const instagramUrl = storeInfo?.instagram_url;
    const whatsappNumber = storeInfo?.whatsapp;
    const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}` : null;

    return (
        <footer className="bg-color-one text-color-three pt-[45px] pb-[25px] transition-colors duration-300">
            <div className="container mx-auto px-[23px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[40px] mb-[60px]">
                    {/* Logo y Descripción */}
                    <div className="flex flex-col sm:items-start sm:text-left">
                        <h2 className="font-footer mb-[40px] uppercase">
                            {storeInfo?.title || 'WOMANITY'}
                        </h2>
                        <p className="font-p-footer max-w-[300px]">
                            {storeInfo?.description || 'Tu destino premium en Lima para vestidos importados de USA. Calidad, estilo y exclusividad en San Isidro.'}
                        </p>
                        <div className="flex gap-[16px] mt-[24px]">
                            {facebookUrl && (
                                <Link href={facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    <FacebookIcon className="size-[24px]" />
                                </Link>
                            )}
                            {instagramUrl && (
                                <Link href={instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    <InstagramIcon className="size-[24px]" />
                                </Link>
                            )}
                            {whatsappUrl && (
                                <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    <WhatsappIcon className="size-[24px]" />
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-[40px]">
                        {/* Navegacion */}
                        <div className="font-p-footer flex flex-col">
                            <p className="mb-[24px] font-bold">
                                Navegacion
                            </p>
                            <ul className="flex flex-col gap-[16px]">
                                <li>
                                    <Link href="/#catalogo" className="hover:underline">Catálogo</Link>
                                </li>
                                <li>
                                    <Link href="/#blog" className="hover:underline">Nuestro blog</Link>
                                </li>
                                <li>
                                    <Link href="/#faq" className="hover:underline">Preguntas frecuentes</Link>
                                </li>
                            </ul>
                        </div>

                        {/* Soporte */}
                        <div className="font-p-footer flex flex-col ">
                            <p className="mb-[24px] font-bold">
                                Soporte
                            </p>
                            <ul className="flex flex-col gap-[16px]">
                                <li>
                                    <Link href="/terminos" className="hover:underline">Términos y condiciones</Link>
                                </li>
                                <li>
                                    <Link href="/privacidad" className="hover:underline">Política de privacidad</Link>
                                </li>
                                <li>
                                    <Link href="/envios" className="hover:underline">Envío y devoluciones</Link>
                                </li>
                            </ul>
                        </div>

                        {/* Visitanos */}
                        <div className="font-p-footer flex flex-col ">
                            <p className="mb-[24px] font-bold">
                                Visitanos
                            </p>
                            <div className="flex flex-col gap-[16px]">
                                <div>
                                    <p className="opacity-70 text-xs">Dirección</p>
                                    <p>{storeInfo?.address || 'Av. Paz Soldán 255 Sótano A24, San Isidro'}</p>
                                </div>
                                {whatsappNumber && (
                                    <div>
                                        <p className="opacity-70 text-xs">WhatsApp</p>
                                        <p>{whatsappNumber}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="opacity-70 text-xs">Horario</p>
                                    <p>{storeInfo?.schedule || 'Lun - Sáb: 10:00 AM - 8:00 PM'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center w-full pt-8 border-t border-color-three/10">
                    <p className="font-p-footer uppercase text-[10px] tracking-widest">
                        {currentYear} {storeInfo?.title || 'WOMANITY BOUTIQUE'}. TODOS LOS DERECHOS RESERVADOS
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default SiteFooter;
