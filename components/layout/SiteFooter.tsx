"use client";

import React from "react";
import Link from "next/link";
import { FacebookIcon, InstagramIcon, WhatsappIcon } from "@/components/ui/Icons";
import { useRemoteTheme } from "@/context/RemoteThemeContext";

interface SiteFooterProps {
    seoTitle?: string;
}

const SiteFooter: React.FC<SiteFooterProps> = ({ seoTitle }) => {
    const { storeInfo, organization } = useRemoteTheme();
    const currentYear = new Date().getFullYear();

    const facebookUrl = storeInfo?.facebook_url;
    const instagramUrl = storeInfo?.instagram_url;
    const whatsappNumber = storeInfo?.whatsapp;
    const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}` : null;

    const siteTitle = organization?.organization_name || 'WOMANITY';

    return (
        <footer className="bg-color-one text-color-three dark:bg-[#1a1a1a] dark:text-white pt-[45px] pb-[25px] transition-colors duration-300">
            <div className="container mx-auto px-[23px] dark:text-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[40px] mb-[60px]">
                    {/* Logo y Descripción */}
                    <div className="flex flex-col sm:items-start sm:text-left">
                        {(storeInfo?.title || seoTitle) && (
                            <h2 className="text-xl font-serif mb-4 text-color-three dark:text-white">
                                {storeInfo?.title || seoTitle}
                            </h2>
                        )}
                        {storeInfo?.logo_url ? (
                            <div className="mb-[40px]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={storeInfo.logo_url} alt={`Logo ${siteTitle}`} className="max-h-[80px] w-auto object-contain dark:brightness-110" />
                                {!storeInfo.logo_url && (
                                    <h2 className="font-footer mt-2 text-sm uppercase dark:text-white opacity-80">
                                        {siteTitle}
                                    </h2>
                                )}
                            </div>
                        ) : (
                            <h2 className="font-footer mb-[40px] uppercase dark:text-white">
                                {siteTitle}
                            </h2>
                        )}
                        <p className="font-p-footer max-w-[300px]">
                            {storeInfo?.description || ''}
                        </p>
                        <div className="flex gap-[16px] mt-[24px]">
                            {facebookUrl && (
                                <Link href={facebookUrl} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-color-two transition-colors">
                                    <FacebookIcon className="size-[24px]" />
                                </Link>
                            )}
                            {instagramUrl && (
                                <Link href={instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-color-two transition-colors">
                                    <InstagramIcon className="size-[24px]" />
                                </Link>
                            )}
                            {whatsappUrl && (
                                <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-color-two transition-colors">
                                    <WhatsappIcon className="size-[24px]" />
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-[40px]">
                        {/* Navegacion */}
                        <div className="font-p-footer flex flex-col dark:text-white">
                            <p className="mb-[24px] font-bold dark:text-white">
                                Navegacion
                            </p>
                            <ul className="flex flex-col gap-[16px]">
                                <li>
                                    <Link href="/#catalogo" className="hover:underline dark:text-white">Catálogo</Link>
                                </li>
                                <li>
                                    <Link href="/#blog" className="hover:underline dark:text-white">Nuestro blog</Link>
                                </li>
                                <li>
                                    <Link href="/#faq" className="hover:underline dark:text-white">Preguntas frecuentes</Link>
                                </li>
                            </ul>
                        </div>

                        {/* Soporte */}
                        <div className="font-p-footer flex flex-col dark:text-white">
                            <p className="mb-[24px] font-bold dark:text-white">
                                Soporte
                            </p>
                            <ul className="flex flex-col gap-[16px]">
                                {storeInfo?.terms_url && (
                                    <li>
                                        <Link href={storeInfo.terms_url} className="hover:underline dark:text-white">Términos y condiciones</Link>
                                    </li>
                                )}
                                {storeInfo?.privacy_url && (
                                    <li>
                                        <Link href={storeInfo.privacy_url} className="hover:underline dark:text-white">Política de privacidad</Link>
                                    </li>
                                )}
                                {storeInfo?.shipping_url && (
                                    <li>
                                        <Link href={storeInfo.shipping_url} className="hover:underline dark:text-white">Envío y devoluciones</Link>
                                    </li>
                                )}
                            </ul>
                        </div>

                        {/* Visitanos */}
                        <div className="font-p-footer flex flex-col dark:text-white">
                            <p className="mb-[24px] font-bold dark:text-white">
                                Visitanos
                            </p>
                            <div className="flex flex-col gap-[16px]">
                                <div>
                                    <p className="opacity-70 text-xs dark:text-white/70">Dirección</p>
                                    <p className="dark:text-white">{storeInfo?.address || ''}</p>
                                </div>
                                {whatsappNumber && (
                                    <div>
                                        <p className="opacity-70 text-xs dark:text-white/70">WhatsApp</p>
                                        <p className="dark:text-white">{whatsappNumber}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="opacity-70 text-xs dark:text-white/70">Horario</p>
                                    <p className="dark:text-white">{storeInfo?.schedule || ''}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center w-full pt-8 border-t border-color-three/10 dark:border-[#2a2a2a]">
                    <p className="font-p-footer uppercase text-[10px] tracking-widest">
                        {storeInfo?.footer_license || `${currentYear} ${siteTitle}. TODOS LOS DERECHOS RESERVADOS`}
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default SiteFooter;
