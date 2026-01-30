import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import VideoGrid from './components/VideoGrid';
import VideoModal from './components/VideoModal';
import AdminFormModal from './components/AdminFormModal';
import AccessCodeModal from './components/AccessCodeModal';
import LoadingOverlay from './components/LoadingOverlay';
import BulkUploadModal from './components/BulkUploadModal';
import Pagination from './components/Pagination';
import FaqAccordion from './components/FaqAccordion';
import BlogPage from './pages/BlogPage';
import ArticlePage from './pages/ArticlePage';
import Footer from './components/Footer';
import { faqData } from './lib/faqData';
import type { Garment, Article } from './types';
import { saveGarment, deleteGarment, deleteGarments, getArticles, saveArticle } from './lib/db';
import { useProducts } from './hooks/useProducts';
import { useFaqs } from './hooks/useFaqs';
import { generateArticleWithAI } from './lib/ai';
import { getFriendlySupabaseError } from './lib/errorUtils';
import { setHomePageSeo, setGarmentPageSeo, setBlogIndexPageSeo, setArticlePageSeo } from './lib/seo';
import authService from './services/authService';
import { PlusIcon, UploadIcon, CheckCircleIcon, DeleteIcon, WhatsappIcon, CloseIcon } from './components/Icons';

const ITEMS_PER_PAGE = 10; // Max items per page

const sortByCreatedAt = <T extends { created_at: string }>(items: T[]): T[] => {
    return [...items].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (isNaN(dateA)) return 1;
        if (isNaN(dateB)) return -1;
        return dateB - dateA;
    });
};

const getCurrentHashPath = () => {
    if (!window.location.hash || window.location.hash === '#') {
        return '/';
    }
    return window.location.hash.substring(1);
};


const App: React.FC = () => {
    const { products: garments, pagination, selectedProduct: selectedGarment, setSelectedProduct: setSelectedGarment, isLoading: isGarmentsLoading, error: garmentsError, fetchProducts, fetchProductById, setProducts: setGarments } = useProducts();
    const { faqsForComponent, fetchFaqs } = useFaqs();
    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [currentPath, setCurrentPath] = useState(getCurrentHashPath());
    
    const [isAdmin, setIsAdmin] = useState(false);
    const [isAccessCodeModalOpen, setIsAccessCodeModalOpen] = useState(false);
    const [accessCodeError, setAccessCodeError] = useState<string | null>(null);
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const [isLogoutLoading, setIsLogoutLoading] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingGarment, setEditingGarment] = useState<Garment | null>(null);
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
    const [isGeneratingArticle, setIsGeneratingArticle] = useState(false);
    const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ brand: 'all', size: 'all', color: 'all' });
    
    const [currentPage, setCurrentPage] = useState(1);
    
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set<number>());
    
    const [whatsappNumber, setWhatsappNumber] = useState<string>(() => {
        const saved = localStorage.getItem('whatsappNumber');
        const fullNumber = saved || '51956382746';
        // Si el número guardado empieza con 51, extraer solo la parte local
        return fullNumber.startsWith('51') ? fullNumber.substring(2) : fullNumber;
    });

    const handleRouteChange = useCallback((path: string) => {
        setCurrentPath(path);
        const isGarmentRoute = path.length > 1 && !path.startsWith('/blog');
        
        if (isGarmentRoute) {
            const garmentSlug = path.substring(1);
            const garmentToOpen = garments.find(g => g.slug === garmentSlug);
            
            if (garmentToOpen) {
                setSelectedGarment(garmentToOpen || null);
                if (garmentToOpen) {
                    fetchProductById(garmentToOpen.id).then(fresh => {
                        if (fresh) setSelectedGarment(fresh);
                    });
                }
            } else if (selectedGarment && selectedGarment.slug === garmentSlug) {
                // Si el producto ya está seleccionado y coincide con la ruta, lo mantenemos
                // Esto evita que se cierre el modal si el producto no está en la lista cargada actualmente
                console.log('Manteniendo producto seleccionado:', selectedGarment.slug);
            } else {
                setSelectedGarment(null);
            }
        } else {
            setSelectedGarment(null);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [garments, fetchProductById, selectedGarment]);

    const navigate = useCallback((path: string) => {
        window.location.hash = path;
    }, []);
    
    useEffect(() => {
        if (authService.isAuthenticated()) {
            setIsAdmin(true);
        }
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [fetchedGarments, fetchedArticles, fetchedFaqs] = await Promise.all([
                    fetchProducts({ page: 1, limit: ITEMS_PER_PAGE }), 
                    getArticles(),
                    /**
                     * Cargar preguntas frecuentes desde el microservicio
                     * Limita a 5 preguntas con estado "activa"
                     * El hook maneja su propio estado y tiene fallback automático a datos por defecto
                     */
                    fetchFaqs(true, false, { limit: 5, estado: 'activa' }).catch(err => {
                        console.warn('Error al cargar preguntas frecuentes:', err);
                        return [];
                    })
                ]);
                console.log('Productos obtenidos (useProducts):', fetchedGarments);
                console.log('Preguntas frecuentes obtenidas (useFaqs):', fetchedFaqs);
                // El hook ya ordena los productos, solo ordenamos articulos
                const sortedArticles = sortByCreatedAt(fetchedArticles);
                
                setArticles(sortedArticles);

                const path = getCurrentHashPath();
                const isGarmentRoute = path.length > 1 && !path.startsWith('/blog');
                if (isGarmentRoute) {
                    const garmentSlug = path.substring(1);
                    const garmentToOpen = fetchedGarments.find(g => g.slug === garmentSlug);
                    setSelectedGarment(garmentToOpen || null);
                    if (garmentToOpen) {
                        fetchProductById(garmentToOpen.id).then(fresh => {
                            if (fresh) setSelectedGarment(fresh);
                        });
                    }
                }
            } catch (err: any) {
                setError(getFriendlySupabaseError(err));
            } finally {
                setIsLoading(false);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        const handleHashChange = () => {
            const path = getCurrentHashPath();
            handleRouteChange(path);
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [handleRouteChange]);

    useEffect(() => {
        if (isLoading) return; // Wait until data is loaded

        if (currentPath.startsWith('/blog/')) {
            const slug = currentPath.substring('/blog/'.length);
            const article = articles.find(a => a.slug === slug);
            const garment = article ? garments.find(g => g.id === article.garment_id) : null;
            if (article && garment) {
                setArticlePageSeo(article, garment);
            }
        } else if (currentPath === '/blog') {
            setBlogIndexPageSeo();
        } else if (currentPath === '/') {
            setHomePageSeo();
        } else {
            // Assumes it's a garment path
            const slug = currentPath.substring(1);
            const garment = garments.find(g => g.slug === slug);
            if (garment) {
                setGarmentPageSeo(garment);
            } else {
                 setHomePageSeo(); // Fallback to home page SEO if no garment found
            }
        }
    }, [currentPath, garments, articles, isLoading]);
    
    const filteredGarments = useMemo(() => {
        return garments.filter(garment => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = searchQuery === '' ||
                garment.title.toLowerCase().includes(searchLower) ||
                garment.brand.toLowerCase().includes(searchLower) ||
                garment.description.toLowerCase().includes(searchLower);

            const matchesBrand = filters.brand === 'all' || garment.brand === filters.brand;
            const matchesSize = filters.size === 'all' || garment.size === filters.size;
            const matchesColor = filters.color === 'all' || garment.color === filters.color;

            return matchesSearch && matchesBrand && matchesSize && matchesColor;
        });
    }, [garments, searchQuery, filters]);

    const paginatedGarments = useMemo(() => {
        return filteredGarments;
    }, [filteredGarments]);

    const totalPages = pagination.totalPages || 1;

    const uniqueFilters = useMemo(() => {
        const brands = [...new Set(garments.map(g => g.brand))].sort();
        const sizes = [...new Set(garments.map(g => g.size))].sort();
        const colors = [...new Set(garments.map(g => g.color))].sort();
        return { brands, sizes, colors };
    }, [garments]);

    const handleFilterChange = useCallback((newFilters: { brand?: string; size?: string; color?: string; }) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1);
    }, []);

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const handleClearFilters = useCallback(() => {
        setFilters({ brand: 'all', size: 'all', color: 'all' });
        setSearchQuery('');
        setCurrentPage(1);
    }, []);

    const handlePageChange = (page: number) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
            fetchProducts({ page, limit: ITEMS_PER_PAGE });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
    
    const handleToggleAdmin = async () => {
        if (isAdmin) {
            setIsLogoutLoading(true);
            try {
                // Simular un pequeño delay para mostrar el loader
                await new Promise(resolve => setTimeout(resolve, 500));
                authService.logout();
                setIsAdmin(false);
                setIsSelectionMode(false);
                setSelectedIds(new Set());
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
            } finally {
                setIsLogoutLoading(false);
            }
        } else {
            setIsAccessCodeModalOpen(true);
        }
    };

    const handleAccessCodeSubmit = async (email: string, password: string) => {
        setIsLoginLoading(true);
        setAccessCodeError(null);
        try {
            console.log('📧 Iniciando login con:', { email });
            const response = await authService.login(email, password);
            console.log('✅ Respuesta exitosa de la API:', response);
            setIsAdmin(true);
            setIsAccessCodeModalOpen(false);
            setAccessCodeError(null);
        } catch (error) {
            console.error('❌ Error en el login:', error);
            setAccessCodeError('Correo o contraseña incorrectos. Inténtalo de nuevo.');
        } finally {
            setIsLoginLoading(false);
        }
    };

    const handleSelectGarment = (garment: Garment) => {
        // SIEMPRE establecer el estado para abrir el modal, tenga slug o no
        setSelectedGarment(garment);
        
        // Actualizar estado local con la información más reciente
        setGarments(prev => {
            const exists = prev.some(g => g.id === garment.id);
            if (exists) {
                return prev.map(g => g.id === garment.id ? garment : g);
            }
            return prev;
        });

        // Solo si tiene slug actualizamos la URL (sin recargar), pero esto es secundario
        if (garment.slug) {
            const newPath = `/${garment.slug}`;
            window.history.pushState(null, '', `#${newPath}`);
            setCurrentPath(newPath);
        }
    };

    const handleCloseModal = () => {
        navigate('/');
    };

    const handleOpenForm = (garment: Garment | null = null) => {
        setEditingGarment(garment);
        setIsFormModalOpen(true);
        if (garment) {
            fetchProductById(garment.id).then(fresh => {
                if (fresh) {
                    console.log('Datos frescos para edición cargados:', fresh);
                    setEditingGarment(fresh);
                }
            });
        }
    };

    const handleSaveGarment = async (product: Garment) => {
        console.log('[App] handleSaveGarment llamado con:', { id: product.id, title: product.title });
        try {
            // 1. Update local state immediately for instant feedback
            setGarments(prev => {
                const exists = prev.some(g => g.id === product.id);
                const newGarments = exists
                    ? prev.map(g => g.id === product.id ? product : g)
                    : [product, ...prev];
                return sortByCreatedAt(newGarments);
            });

            // 2. Also trigger a background refetch to ensure consistency with server
            // We don't await this to keep UI responsive
            // Reloading products for current page
            fetchProducts({ page: currentPage, limit: ITEMS_PER_PAGE }).catch(err => console.error("Background fetch failed:", err));

            setEditingGarment(null);
            setIsFormModalOpen(false);
        } catch (err: any) {
            console.error("Failed to process saved garment:", err);
            console.log(`Error al procesar la prenda: ${getFriendlySupabaseError(err)}`);
        }
    };

    const handleDeleteGarment = async (id: number) => {
        const garmentToDelete = garments.find(g => g.id === id);
        if (!garmentToDelete) return;

        try {
            await deleteGarment(garmentToDelete);
            setGarments(prev => prev.filter(g => g.id !== id));
        } catch (err: any) {
            console.error("Failed to delete garment:", err);
            console.log(`Error al eliminar la prenda: ${getFriendlySupabaseError(err)}`);
        }
    };

    const handleBulkSaveComplete = (newGarments: Garment[]) => {
        setGarments(prev => sortByCreatedAt([...newGarments, ...prev]));
        setIsBulkUploadModalOpen(false);
    };
    
    const handleToggleSelectionMode = () => {
        if (!isAdmin) return;
        setIsSelectionMode(!isSelectionMode);
        setSelectedIds(new Set());
    };
    
    const handleToggleSelection = (id: number) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };
    
    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        
        const garmentsToDelete = garments.filter(g => selectedIds.has(g.id));
        if (window.confirm(`¿Estás seguro de que quieres eliminar ${selectedIds.size} prendas seleccionadas?`)) {
            try {
                await deleteGarments(garmentsToDelete);
                setGarments(prev => prev.filter(g => !selectedIds.has(g.id)));
                setSelectedIds(new Set());
                setIsSelectionMode(false);
            } catch (err: any) {
                console.error("Failed to bulk delete garments:", err);
                console.log(`Error al eliminar las prendas: ${getFriendlySupabaseError(err)}`);
            }
        }
    };
    
    const handleGenerateArticle = async (garment: Garment) => {
        if (!garment) return;
        setIsGeneratingArticle(true);
        try {
            const articleContent = await generateArticleWithAI(garment);
            const newArticle: Omit<Article, 'id' | 'created_at' | 'slug'> = {
                ...articleContent,
                image_url: garment.videoUrl,
                garment_id: garment.id,
            };
            const savedArticle = await saveArticle(newArticle);
            setArticles(prev => sortByCreatedAt([savedArticle, ...prev]));
            console.log(`¡Artículo "${savedArticle.title}" creado con éxito!`);
            navigate(`/blog/${savedArticle.slug}`);
        } catch (err: any) {
            console.error("Failed to generate article:", err);
            console.log(`Error al generar el artículo: ${err.message}`);
        } finally {
            setIsGeneratingArticle(false);
        }
    };

    const handleWhatsappNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, ''); // Solo números
        // Limitar a 9 dígitos (número local peruano)
        if (value.length <= 9) {
            setWhatsappNumber(value);
        }
    };

    const handleSaveWhatsappNumber = () => {
        if (whatsappNumber.trim()) {
            // Guardar con el prefijo 51
            const fullNumber = `51${whatsappNumber}`;
            localStorage.setItem('whatsappNumber', fullNumber);
            setIsWhatsappModalOpen(false);
        }
    };

    const renderPage = () => {
        if (currentPath.startsWith('/blog/')) {
            const slug = currentPath.substring('/blog/'.length);
            const article = articles.find(a => a.slug === slug);
            const garment = article ? garments.find(g => g.id === article.garment_id) : null;
            if (article && garment) {
                return <ArticlePage data={{ article, garment }} navigate={navigate} />;
            }
            return <div className="text-center py-16 text-stone-900 dark:text-stone-100">Artículo no encontrado.</div>;
        }

        if (currentPath === '/blog') {
            return <BlogPage articles={articles} navigate={navigate} />;
        }

        // Default home page view
        return (
            <>
                {isAdmin && (
                    <section className="mt-8 mb-8 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm border border-stone-200 dark:border-stone-700 rounded-xl shadow-sm overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-base font-medium font-sans text-stone-700 dark:text-stone-200 mb-4">Administra Catálogo</h2>
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                {/* Sección de acciones principales */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <button 
                                        onClick={() => handleOpenForm(null)} 
                                        className="inline-flex items-center gap-2 bg-stone-800 dark:bg-stone-700 text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-600 active:bg-stone-900 dark:active:bg-stone-800 transition-all duration-200 text-sm shadow-md hover:shadow-lg"
                                    >
                                        <PlusIcon className="w-4 h-4" />
                                        <span>Añadir Prenda</span>
                                    </button>
                                    <button 
                                        onClick={() => setIsBulkUploadModalOpen(true)} 
                                        className="inline-flex items-center gap-2 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-semibold py-2.5 px-5 rounded-lg border border-stone-300 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700 hover:border-stone-400 dark:hover:border-stone-500 active:bg-stone-100 dark:active:bg-stone-600 transition-all duration-200 text-sm shadow-sm hover:shadow-md"
                                    >
                                        <UploadIcon className="w-4 h-4" />
                                        <span>Carga Masiva</span>
                                    </button>
                                </div>
                                
                                {/* Sección de selección múltiple */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="h-6 w-px bg-sky-300 dark:bg-white hidden lg:block"></div>
                                    <button 
                                        onClick={handleToggleSelectionMode} 
                                        className={`inline-flex items-center gap-2 font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 text-sm ${
                                            isSelectionMode 
                                                ? 'bg-sky-600 text-white shadow-md hover:bg-sky-700 hover:shadow-lg' 
                                                : 'bg-white dark:bg-stone-800 text-sky-700 dark:text-white border border-sky-300 dark:border-stone-600 hover:bg-sky-50 dark:hover:bg-stone-700 hover:border-sky-400 dark:hover:border-stone-500 shadow-sm hover:shadow-md'
                                        }`}
                                    >
                                        <CheckCircleIcon className={`w-4 h-4 ${isSelectionMode ? '' : 'opacity-70'}`} />
                                        <span>{isSelectionMode ? 'Cancelar Selección' : 'Seleccionar Múltiples'}</span>
                                    </button>
                                    {isSelectionMode && selectedIds.size > 0 && (
                                        <button 
                                            onClick={handleBulkDelete} 
                                            className="inline-flex items-center gap-2 bg-red-600 dark:bg-red-700 text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 active:bg-red-800 dark:active:bg-red-800 transition-all duration-200 text-sm shadow-md hover:shadow-lg"
                                        >
                                            <DeleteIcon className="w-4 h-4" />
                                            <span>Eliminar</span>
                                            <span className="ml-1 bg-red-700/50 px-2 py-0.5 rounded-full text-xs font-semibold">
                                                {selectedIds.size}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Botón de WhatsApp */}
                            <div className="mt-6 pt-6 border-t border-sky-200 dark:border-white">
                                <button
                                    onClick={() => setIsWhatsappModalOpen(true)}
                                    className="inline-flex items-center gap-2 bg-[#25D366] text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-[#20BA5A] active:bg-[#1DA851] transition-all duration-200 text-sm shadow-md hover:shadow-lg"
                                >
                                    <WhatsappIcon className="w-5 h-5" />
                                    <span>Agrega número</span>
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {filteredGarments.length > 0 ? (
                   <VideoGrid 
                       garments={paginatedGarments}
                       onSelectGarment={handleSelectGarment}
                       isAdmin={isAdmin}
                       onEdit={handleOpenForm}
                       onDelete={handleDeleteGarment}
                       isSelectionMode={isSelectionMode}
                       selectedIds={selectedIds}
                       onToggleSelection={handleToggleSelection}
                   />
                ) : (
                   <p className="text-center text-lg text-stone-500 dark:text-stone-400 py-16">No se encontraron prendas que coincidan con tu búsqueda.</p>
                )}
                
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />

                <section className="mt-24">
                    <BlogPage articles={articles} navigate={navigate} />
                </section>

                <section className="mt-24 max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-semibold text-center text-stone-800 dark:text-stone-100 mb-8">Preguntas Frecuentes</h2>
                    {/**
                     * Renderiza el componente de preguntas frecuentes
                     * Usa datos del microservicio si están disponibles, sino usa datos por defecto (fallback)
                     */}
                    <FaqAccordion items={faqsForComponent.length > 0 ? faqsForComponent : faqData} />
                </section>
            </>
        );
    };

    return (
      <div className="bg-stone-50 dark:bg-stone-900 min-h-screen font-sans text-stone-900 dark:text-stone-100 transition-colors">
        <Header 
            isAdmin={isAdmin}
            onToggleAdmin={handleToggleAdmin}
            navigate={navigate}
        />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-80">
            {isLoading && (garments.length === 0) && <p className="text-center text-lg text-stone-500 dark:text-stone-400 py-16">Cargando...</p>}
            {error && <p className="text-center text-lg text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-4 rounded-md whitespace-pre-wrap">{error}</p>}

            {!isLoading && !error && renderPage()}
        </main>
        
        {selectedGarment && (
            <VideoModal 
                garment={selectedGarment}
                onClose={handleCloseModal}
                garmentList={filteredGarments}
                onChangeGarment={handleSelectGarment}
                onGenerateArticle={isAdmin ? handleGenerateArticle : undefined}
                isGeneratingArticle={isGeneratingArticle}
                articleExists={articles.some(a => a.garment_id === selectedGarment.id)}
            />
        )}
        
        {isAccessCodeModalOpen && (
            <AccessCodeModal 
                onClose={() => {
                    if (!isLoginLoading) {
                        setIsAccessCodeModalOpen(false);
                        setAccessCodeError(null);
                    }
                }}
                onSubmit={handleAccessCodeSubmit}
                error={accessCodeError}
                isLoading={isLoginLoading}
            />
        )}

        {isLogoutLoading && (
            <LoadingOverlay message="Cerrando sesión..." />
        )}
        
        {isFormModalOpen && (
            <AdminFormModal 
                garment={editingGarment}
                onClose={() => setIsFormModalOpen(false)}
                onSave={handleSaveGarment}
            />
        )}
        
        {isBulkUploadModalOpen && (
            <BulkUploadModal 
                onClose={() => setIsBulkUploadModalOpen(false)}
                onBulkSaveComplete={handleBulkSaveComplete}
            />
        )}

        {isWhatsappModalOpen && (
            <div
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
                onClick={() => setIsWhatsappModalOpen(false)}
                role="dialog"
                aria-modal="true"
                aria-labelledby="whatsapp-modal-title"
            >
                <div
                    className="relative bg-stone-50 dark:bg-stone-800 rounded-lg shadow-2xl w-full max-w-sm animate-modal-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 id="whatsapp-modal-title" className="text-2xl font-semibold !font-sans text-stone-900 dark:text-stone-100 flex items-center gap-2">
                                <WhatsappIcon className="w-6 h-6 text-[#25D366]" />
                                Registra el número
                            </h2>
                            <button
                                onClick={() => setIsWhatsappModalOpen(false)}
                                className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                                aria-label="Cerrar"
                            >
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                        <p className="text-stone-600 dark:text-stone-300 mb-6">
                            Ingresa el número de WhatsApp que se usará para las consultas.
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="whatsapp-number-input" className="block text-sm font-semibold text-stone-700 dark:text-stone-200 mb-2">
                                    Número de WhatsApp
                                </label>
                                <div className="flex items-center">
                                    <span className="px-4 py-2.5 bg-stone-100 dark:bg-stone-700 border border-r-0 border-stone-300 dark:border-stone-600 rounded-l-lg text-sm font-semibold text-stone-700 dark:text-stone-200">
                                        +51
                                    </span>
                                    <input
                                        id="whatsapp-number-input"
                                        type="text"
                                        value={whatsappNumber}
                                        onChange={handleWhatsappNumberChange}
                                        placeholder="956382746"
                                        maxLength={9}
                                        className="flex-1 px-4 py-2.5 border border-stone-300 dark:border-stone-600 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent text-sm font-sans bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Ingresa solo el número local (9 dígitos)</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsWhatsappModalOpen(false)}
                                    className="flex-1 bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold py-2.5 px-4 rounded-lg border border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveWhatsappNumber}
                                    disabled={whatsappNumber.trim().length < 9}
                                    className="flex-1 bg-[#25D366] text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-[#20BA5A] active:bg-[#1DA851] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <Footer
            brands={uniqueFilters.brands}
            sizes={uniqueFilters.sizes}
            colors={uniqueFilters.colors}
            filters={filters}
            onFilterChange={handleFilterChange}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onClearAll={handleClearFilters}
        />
      </div>
    );
};

export default App;