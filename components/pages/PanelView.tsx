"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SpinnerIcon } from "@/components/ui/Icons";
import { useAuth } from "@/hooks/useAuth";

export default function PanelView() {
    const router = useRouter();
    const { authenticated, getUser, organization, onLogout } = useAuth();
    const user = getUser?.();

    const [activeTab, setActiveTab] = useState("setup");
    const [formData, setFormData] = useState({
        organization_name: "",
        organization_display_name: "",
        domain: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDomain, setShowDomain] = useState(false);

    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    };

    // Redirigir si no está autenticado o si ya tiene organización
    useEffect(() => {
        if (!authenticated) {
            router.push("/");
            return;
        }

        // Si ya tiene organización configurada
        if (organization && typeof window !== 'undefined') {
            const currentHostname = window.location.hostname;

            // Si tiene dominio externo y no estamos ahí, redirigir
            if (organization.domain && currentHostname !== organization.domain) {
                window.location.href = `https://${organization.domain}/`;
                return;
            }

            // Si ya estamos en el sitio correcto y ya tiene organización, 
            // no tiene sentido estar en /panel (que es el setup), lo enviamos a /
            if (window.location.pathname === '/panel') {
                router.push('/');
            }
        }
    }, [authenticated, organization, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === "organization_display_name") {
            setFormData(prev => ({
                ...prev,
                organization_display_name: value,
                organization_name: generateSlug(value)
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Simple validación de slug (organization_name)
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(formData.organization_name)) {
            setError("El ID de la empresa solo debe contener letras minúsculas, números y guiones.");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/organization", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    domain: showDomain ? formData.domain : ""
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Ocurrió un error al crear la empresa");
            }

            // Éxito - Redirección al dominio si existe, si no, se queda en el panel
            if (formData.domain) {
                window.location.href = `https://${formData.domain}/panel`;
            } else {
                alert("¡Organización creada con éxito!");
                // Aquí podrías mutar el usuario / forzar relogin si quieres
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!authenticated) return null;

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-stone-800 rounded-2xl shadow-xl overflow-hidden border border-stone-200 dark:border-stone-700">
                <div className="bg-stone-900 dark:bg-stone-950 p-6 text-center relative">
                    <button
                        onClick={() => onLogout()}
                        className="absolute top-4 right-4 text-xs text-stone-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                        <span>Cerrar Sesión</span>
                    </button>
                    <h1 className="text-2xl mt-3 font-bold text-white">Bienvenido, {user?.name || 'Usuario'}</h1>
                    <p className="text-stone-300 mt-2 text-sm">
                        Configura tu organización para comenzar a gestionar tus productos.
                    </p>
                </div>

                <div className="p-8">
                    <h2 className="text-xl font-semibold text-stone-800 dark:text-stone-100 mb-6 text-center">
                        Configura tu Organización
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label
                                htmlFor="organization_display_name"
                                className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1"
                            >
                                Nombre del Negocio *
                            </label>
                            <input
                                type="text"
                                id="organization_display_name"
                                name="organization_display_name"
                                value={formData.organization_display_name}
                                onChange={handleChange}
                                required
                                placeholder="Ej. Mi Tienda de Ropa"
                                className="w-full p-3 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 bg-transparent text-stone-900 dark:text-stone-100 transition-colors"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="organization_name"
                                className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1"
                            >
                                Identificador de la Empresa (URL)
                            </label>
                            <div className="flex items-center gap-2 p-3 bg-stone-100 dark:bg-stone-700/50 border border-stone-200 dark:border-stone-600 rounded-lg">
                                <span className="text-stone-400 text-sm">vestido.shop/</span>
                                <input
                                    type="text"
                                    id="organization_name"
                                    name="organization_name"
                                    value={formData.organization_name}
                                    onChange={handleChange}
                                    readOnly
                                    className="bg-transparent border-none p-0 focus:ring-0 text-stone-600 dark:text-stone-400 text-sm w-full cursor-default"
                                />
                            </div>
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 italic">
                                * Se genera automáticamente basado en el nombre de tu negocio.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 py-2">
                            <input
                                type="checkbox"
                                id="has_custom_domain"
                                checked={showDomain}
                                onChange={(e) => {
                                    setShowDomain(e.target.checked);
                                    if (!e.target.checked) setFormData(prev => ({ ...prev, domain: "" }));
                                }}
                                className="w-5 h-5 rounded border-stone-300 text-stone-900 focus:ring-stone-500 cursor-pointer"
                            />
                            <label htmlFor="has_custom_domain" className="text-sm font-medium text-stone-700 dark:text-stone-300 cursor-pointer">
                                Tengo un dominio propio (opcional)
                            </label>
                        </div>

                        {showDomain && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label
                                    htmlFor="domain"
                                    className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1"
                                >
                                    Tu Dominio
                                </label>
                                <input
                                    type="text"
                                    id="domain"
                                    name="domain"
                                    value={formData.domain}
                                    onChange={handleChange}
                                    placeholder="Ej. mitienda.com"
                                    className="w-full p-3 border border-stone-300 dark:border-stone-600 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-stone-500 bg-transparent text-stone-900 dark:text-stone-100 transition-colors"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm border border-red-200 dark:border-red-800 text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading || !formData.organization_display_name || !formData.organization_name}
                            className="w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 dark:bg-stone-100 dark:hover:bg-white dark:text-stone-900 text-white dark:disabled:bg-stone-600 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <SpinnerIcon className="w-5 h-5 animate-spin" />
                                    Creando Empresa...
                                </>
                            ) : (
                                "Continuar al Panel"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
