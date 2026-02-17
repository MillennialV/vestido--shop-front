"use client";

import React from "react";
import Link from "next/link";
import { FacebookIcon, InstagramIcon, WhatsappIcon } from "./Icons";

const SiteFooter: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 pt-16 pb-32 transition-colors duration-300">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Logo y Descripción */}
                    <div className="space-y-6">
                        <h2 className="text-2xl font-semibold tracking-wider text-stone-900 dark:text-white">
                            Vestidos de Fiesta
                        </h2>
                        <p className="text-stone-500 dark:text-stone-400 leading-relaxed max-w-xs">
                            Tu destino premium en Lima para vestidos importados de USA. Calidad, estilo y exclusividad en San Isidro.
                        </p>
                        <div className="flex gap-4">
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                                <InstagramIcon className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                            </a>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                                <FacebookIcon className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                            </a>
                            <a href="https://wa.me/51956382746" target="_blank" rel="noopener noreferrer" className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                                <WhatsappIcon className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                            </a>
                        </div>
                    </div>

                    {/* Enlaces Rápidos */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-900 dark:text-white">
                            Navegación
                        </h3>
                        <ul className="space-y-4 text-stone-500 dark:text-stone-400">
                            <li>
                                <Link href="/#catalogo" className="hover:text-stone-900 dark:hover:text-white transition-colors">Catálogo</Link>
                            </li>
                            <li>
                                <Link href="/#blog" className="hover:text-stone-900 dark:hover:text-white transition-colors">Nuestro Blog</Link>
                            </li>
                            <li>
                                <Link href="/#faq" className="hover:text-stone-900 dark:hover:text-white transition-colors">Preguntas Frecuentes</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Soporte y Legal */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-900 dark:text-white">
                            Soporte
                        </h3>
                        <ul className="space-y-4 text-stone-500 dark:text-stone-400">
                            <li>
                                <Link href="/terminos" className="hover:text-stone-900 dark:hover:text-white transition-colors">Términos y Condiciones</Link>
                            </li>
                            <li>
                                <Link href="/privacidad" className="hover:text-stone-900 dark:hover:text-white transition-colors">Política de Privacidad</Link>
                            </li>
                            <li>
                                <Link href="/envios" className="hover:text-stone-900 dark:hover:text-white transition-colors">Envíos y Devoluciones</Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contacto y Ubicación */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-900 dark:text-white">
                            Visítanos
                        </h3>
                        <div className="space-y-4 text-stone-500 dark:text-stone-400">
                            <p className="flex flex-col">
                                <span className="font-medium text-stone-900 dark:text-stone-200 text-sm">Dirección</span>
                                Av. Paz Soldán 255 Sótano A24, San Isidro
                            </p>
                            <p className="flex flex-col">
                                <span className="font-medium text-stone-900 dark:text-stone-200 text-sm">WhatsApp</span>
                                +51 956 382 746
                            </p>
                            <p className="flex flex-col text-xs mt-4">
                                <span className="font-medium text-stone-900 dark:text-stone-200 text-sm">Horario</span>
                                Lun - Sáb: 10:00 AM - 8:00 PM
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-stone-100 dark:border-stone-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-stone-400">
                        © {currentYear} Vestido de Fiesta / Womanity Boutique. Todos los derechos reservados.
                    </p>
                    <p className="text-xs text-stone-400">
                        Showroom exclusivo en San Isidro, Lima - Perú.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default SiteFooter;
