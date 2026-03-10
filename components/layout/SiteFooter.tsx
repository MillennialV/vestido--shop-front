"use client";

import React from "react";
import Link from "next/link";
import { FacebookIcon, InstagramIcon, WhatsappIcon } from "@/components/ui/Icons";

const SiteFooter: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-color-one text-color-three pt-[45px] pb-[25px] transition-colors duration-300">
            <div className="container mx-auto px-[23px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[40px] mb-[60px]">
                    {/* Logo y Descripción */}
                    <div className="flex flex-col sm:items-start sm:text-left">
                        <h2 className="font-footer mb-[40px] ">
                            WOMANITY
                        </h2>
                        <p className="font-p-footer max-w-[250px]">
                            Tu destino premium en Lima para vestidos importados de USA. Calidad, estilo y exclusividad en San Isidro.
                        </p>
                        <div className="flex gap-[16px] mt-[24px]">
                            <Link href="#" className="hover:underline"><FacebookIcon className="size-[24px]" /></Link>
                            <Link href="#" className="hover:underline"><InstagramIcon className="size-[24px]" /></Link>
                            <Link href="#" className="hover:underline"><WhatsappIcon className="size-[24px]" /></Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-[40px]">
                        {/* Navegacion */}
                        <div className="font-p-footer flex flex-col">
                            <p className="mb-[24px]">
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
                            <p className="mb-[24px]">
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
                            <p className="mb-[24px]">
                                Visitanos
                            </p>
                            <div className="flex flex-col gap-[16px]">
                                <div>
                                    <p>Dirección</p>
                                    <p>Av. Paz Soldán 255 Sótano A24, San Isidro</p>
                                </div>
                                <div>
                                    <p>WhatsApp</p>
                                    <p>+51 956 382 746</p>
                                </div>
                                <div>
                                    <p>Horario</p>
                                    <p>Lun - Sáb: 10:00 AM - 8:00 PM</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center w-full">
                    <p className="font-p-footer">
                        {currentYear} vestidos de fiesta/ womanity boutique. todos los derechos reservados
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default SiteFooter;
