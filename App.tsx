import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import VideoModal from './components/VideoModal';
import AdminFormModal from './components/AdminFormModal';
import AccessCodeModal from './components/AccessCodeModal';
import LoadingOverlay from './components/LoadingOverlay';
import BulkUploadModal from './components/BulkUploadModal';
import Pagination from './components/Pagination';
import FaqAccordion from './components/FaqAccordion';
import FaqModal from './components/FaqModal';
import PostPage from './pages/PostPage';
import PostFormModal from './components/PostFormModal';
import Footer from './components/Footer';
import CatalogToolbar from './components/CatalogToolbar';
import ConfirmationModal from './components/ConfirmationModal';
import { faqData } from './lib/faqData';
import type { Garment } from '@/types/Garment';
import type { FaqItem } from '@/types/FaqItem';
import type { Post } from '@/types/post';
import { saveGarment, deleteGarment, deleteGarments, getArticles, saveArticle } from './lib/db';
import { useProducts } from './hooks/useProducts';
import { useFaqs } from './hooks/useFaqs';
import { generateArticleWithAI } from './lib/ai';
import { getFriendlySupabaseError } from './lib/errorUtils';
import { setHomePageSeo, setGarmentPageSeo, setBlogIndexPageSeo, setPostPageSeo } from './lib/seo';
import { useAuth } from './hooks/useAuth';
import { azureStorageService } from './services/azureStorageService';
import Blog from './components/Blog';
import { PlusIcon } from './components/Icons';
import WhatsappModal from './components/WhatsappModal';
import VideoCard from './components/VideoCard';
import { usePosts } from './hooks/usePosts';
import { preguntasService, PreguntasServiceError } from './services/faqService';
import { DropResult } from '@hello-pangea/dnd';

const ITEMS_PER_PAGE = 10; // Max items per page
const POSTS_PER_PAGE = 6; // Max items per page
const FAQ_LIMIT = Number(import.meta.env.VITE_FAQ_LIMIT) || 5; 

const sortByCreatedAt = <T extends { created_at: string }>(items: T[]): T[] => {
    return [...items].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        if (isNaN(dateA)) return 1;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
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
    const [faqsLocal, setFaqsLocal] = useState<FaqItem[]>([]);

    const { authenticated, onLogout, onLogin } = useAuth();
    const { products: garments, pagination, selectedProduct: selectedGarment, setSelectedProduct: setSelectedGarment, isLoading: isGarmentsLoading, error: garmentsError, fetchProducts, fetchProductById, setProducts: setGarments } = useProducts();
    const { posts, pagination: postsPagination, isLoading: isPostsLoading, error: postsError, fetchPosts, fetchPostById, createPost, updatePost, deletePost, setPosts } = usePosts();
    const { faqsForComponent, fetchFaqs, faqs } = useFaqs();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (faqsForComponent && faqsForComponent.length > 0) {
            setFaqsLocal(faqsForComponent);
        }
    }, [faqsForComponent]);

    const [currentPath, setCurrentPath] = useState(getCurrentHashPath());

    const [isAccessCodeModalOpen, setIsAccessCodeModalOpen] = useState(false);
    const [accessCodeError, setAccessCodeError] = useState<string | null>(null);
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingGarment, setEditingGarment] = useState<Garment | null>(null);
    const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
    const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
    const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
    const [faqModalMode, setFaqModalMode] = useState<'create' | 'edit' | 'delete'>('create');
    const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);

    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);

    // Delete Confirmation State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<Post | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({ brand: 'all', size: 'all', color: 'all' });

    const [currentPage, setCurrentPage] = useState(1);

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set<number>());

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
        const loadInitialData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [fetchedGarments, fetchedFaqs, fetchedPosts] = await Promise.all([
                    fetchProducts({ page: 1, limit: ITEMS_PER_PAGE }),
                    fetchFaqs(true, false, { limit: FAQ_LIMIT, estado: 'activa', order:'ASC'}).catch(err => {
                        return [];
                    }),
                    fetchPosts({ page: 1, limit: POSTS_PER_PAGE }).catch(err => {
                        return [];
                    })
                ]);

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

    // Reload posts when login status changes
    useEffect(() => {
        fetchPosts({ page: 1, limit: POSTS_PER_PAGE }).catch(console.error);
    }, [authenticated, fetchPosts]);

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
            const post = posts.find(a => a.slug === slug);
            if (post) {
                setPostPageSeo(post);
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
    }, [currentPath, garments, posts, isLoading]);

    const filteredGarments = useMemo(() => {
        return garments.filter(garment => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = searchQuery === '' ||
                garment.title.toLowerCase().includes(searchLower) ||
                garment.brand.toLowerCase().includes(searchLower) ||
                garment.ASCription.toLowerCase().includes(searchLower);

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
        if (authenticated) {
            try {
                onLogout();
                setIsSelectionMode(false);
                setSelectedIds(new Set());
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
            }
        } else {
            setIsAccessCodeModalOpen(true);
        }
    };

    const handleAccessCodeSubmit = async (email: string, password: string) => {
        setIsLoginLoading(true);
        setAccessCodeError(null);
        try {
            await onLogin(email, password);
            setIsAccessCodeModalOpen(false);
            setAccessCodeError(null);
        } catch (error) {
            setAccessCodeError('Correo o contraseña incorrectos. Inténtalo de nuevo.');
        } finally {
            setIsLoginLoading(false);
        }
    };

    const handleSelectGarment = (garment: Garment) => {
        setSelectedGarment(garment);

        setGarments(prev => {
            const exists = prev.some(g => g.id === garment.id);
            if (exists) {
                return prev.map(g => g.id === garment.id ? garment : g);
            }
            return prev;
        });

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
            setGarments(prev => {
                const exists = prev.some(g => g.id === product.id);
                const newGarments = exists
                    ? prev.map(g => g.id === product.id ? product : g)
                    : [product, ...prev];
                return sortByCreatedAt(newGarments);
            });

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
        if (!authenticated) return;
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


    const handleOpenPostModal = (post: Post | null = null) => {
        setEditingPost(post);
        setIsPostModalOpen(true);
    };

    const handleSavePost = (post: Post) => {
        setPosts(prev => {
            const exists = prev.some(p => p.id === post.id);
            if (exists) {
                return prev.map(p => p.id === post.id ? post : p);
            }
            return [post, ...prev];
        });
        setIsPostModalOpen(false);
        setEditingPost(null);
    };

    const handleDeletePost = (post: Post) => {
        setPostToDelete(post);
        setIsDeleteModalOpen(true);
    };

    const confirmDeletePost = async () => {
        if (!postToDelete) return;

        setIsDeleting(true);
        try {
            // Delete image from Azure Storage if exists
            if (postToDelete.featured_image_url) {
                await azureStorageService.deleteImage(postToDelete.featured_image_url);
            }

            await deletePost(postToDelete.id);
            setPosts(prev => prev.filter(p => p.id !== postToDelete.id));
            setIsDeleteModalOpen(false);
            setPostToDelete(null);
        } catch (error) {
            console.error("Error deleting post:", error);
            // Here we could keep the modal open or show an error state
            alert("Error al eliminar el artículo"); // Consider using a toast or in-modal error later
        } finally {
            setIsDeleting(false);
        }
    };


    const handleReorderFaqs = useCallback(async (newOrder: FaqItem[], result: DropResult) => {
        setFaqsLocal(newOrder);
        
        try {
            const updatePromises = newOrder
                .filter(item => {
                    const original = faqs.find((f: FaqItem) => f.id === item.id);
                    return original && original.orden !== item.orden;
                })
                .map(item => preguntasService.actualizarPregunta(item.id, { orden: item.orden }));

            if (updatePromises.length > 0) {
                await Promise.all(updatePromises);
                await fetchFaqs(true, true, { limit: FAQ_LIMIT, estado: 'activa', order:'ASC'});
            }
        } catch (err) {
            await fetchFaqs(true, true, { limit: FAQ_LIMIT, estado: 'activa', order:'ASC'});
        }
    }, [faqs, fetchFaqs]);

    const renderPage = () => {
        if (currentPath.startsWith('/blog/')) {
            const slug = currentPath.substring('/blog/'.length);
            const post = posts.find(a => a.slug === slug);
            if (post) {
                return <PostPage post={post} navigate={navigate} />;
            }
            return <div className="text-center py-16 text-stone-900 dark:text-stone-100">Artículo no encontrado.</div>;
        }

        if (currentPath === '/blog') {
            return (
                <Blog
                    posts={posts}
                    navigate={navigate}
                    isAdmin={authenticated}
                    onAddPost={() => handleOpenPostModal(null)}
                    onEditPost={handleOpenPostModal}
                    onDeletePost={handleDeletePost}
                />
            );
        }

        // Default home page view
        return (
            <>
                {authenticated && (
                    <CatalogToolbar
                        onAddGarment={() => handleOpenForm(null)}
                        onBulkUpload={() => setIsBulkUploadModalOpen(true)}
                        onToggleSelectionMode={handleToggleSelectionMode}
                        isSelectionMode={isSelectionMode}
                        selectedCount={selectedIds.size}
                        onBulkDelete={handleBulkDelete}
                        onWhatsapp={() => setIsWhatsappModalOpen(true)}
                    />
                )}

                {filteredGarments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                        {paginatedGarments.map((garment) => (
                            <VideoCard
                                key={garment.id}
                                garment={garment}
                                onSelect={handleSelectGarment}
                                isAdmin={authenticated}
                                onEdit={handleOpenForm}
                                onDelete={handleDeleteGarment}
                                isSelectionMode={isSelectionMode}
                                isSelected={selectedIds.has(garment.id)}
                                onToggleSelection={handleToggleSelection}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-lg text-stone-500 dark:text-stone-400 py-16">No se encontraron prendas que coincidan con tu búsqueda.</p>
                )}

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />

                <section className="mt-24">
                    <Blog
                        posts={posts}
                        navigate={navigate}
                        isAdmin={authenticated}
                        onAddPost={() => handleOpenPostModal(null)}
                        onEditPost={handleOpenPostModal}
                        onDeletePost={handleDeletePost}
                    />
                </section>

                <section className="mt-24 max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl md:text-4xl font-semibold text-stone-800 dark:text-stone-100">Preguntas Frecuentes</h2>
                        {authenticated && (
                            <button
                                onClick={() => {
                                    setFaqModalMode('create');
                                    setEditingFaq(null);
                                    setIsFaqModalOpen(true);
                                }}
                                className="inline-flex items-center gap-2 bg-stone-800 dark:bg-stone-700 text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-600 active:bg-stone-900 dark:active:bg-stone-800 transition-all duration-200 text-sm shadow-md hover:shadow-lg"
                            >
                                <PlusIcon className="w-4 h-4" />
                                <span>Agregar pregunta</span>
                            </button>
                        )}
                    </div>
                    <FaqAccordion
                        items={
                            authenticated 
                                ? (faqsLocal.length > 0 ? faqsLocal : faqsForComponent)
                                : (faqsForComponent.length > 0 ? faqsForComponent : faqData)
                        }
                        isAdmin={authenticated}
                        onEdit={(faq) => {
                            const fullFaq = faqs.find(f => f.id === faq.id) || faq;
                            setEditingFaq(fullFaq);
                            setFaqModalMode('edit');
                            setIsFaqModalOpen(true);
                        }}
                        onDelete={(faq) => {
                            const fullFaq = faqs.find(f => f.id === faq.id) || faq;
                            setEditingFaq(fullFaq);
                            setFaqModalMode('delete');
                            setIsFaqModalOpen(true);
                        }}
                        onReorder={handleReorderFaqs}
                    />
                </section>
            </>
        );
    };



    return (
        <div className="bg-stone-50 dark:bg-stone-900 min-h-screen font-sans text-stone-900 dark:text-stone-100 transition-colors">
            <Header
                isAdmin={authenticated}
                onToggleAdmin={handleToggleAdmin}
                navigate={navigate}
            />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-80">
                {isLoading && (garments.length === 0) && <p className="text-center text-lg text-stone-500 dark:text-stone-400 py-16">Cargando...</p>}
                {error && <p className="text-center text-lg text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-4 rounded-md whitespace-pre-wrap">{error}</p>}

                {!isLoading && !error && renderPage()}
            </main>

            {!currentPath.startsWith('/blog') && (
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
            )}

            {selectedGarment && (
                <VideoModal
                    garment={selectedGarment}
                    onClose={handleCloseModal}
                    garmentList={filteredGarments}
                    onChangeGarment={handleSelectGarment}
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
                <WhatsappModal
                    isOpen={isWhatsappModalOpen}
                    onClose={() => setIsWhatsappModalOpen(false)}
                />
            )}

            {isPostModalOpen && (
                <PostFormModal
                    post={editingPost}
                    onClose={() => setIsPostModalOpen(false)}
                    onSave={handleSavePost}
                />
            )}


            {isFaqModalOpen && (
                <FaqModal
                    mode={faqModalMode}
                    faq={editingFaq}
                    onClose={() => {
                        setIsFaqModalOpen(false);
                        setEditingFaq(null);
                    }}
                    onSuccess={() => {
                        fetchFaqs(true, true, { limit: FAQ_LIMIT, estado: 'activa', order:'ASC'}).catch(err => {
                            console.warn('Error al recargar preguntas frecuentes:', err);
                        });
                    }}
                />
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    if (!isDeleting) {
                        setIsDeleteModalOpen(false);
                        setPostToDelete(null);
                    }
                }}
                onConfirm={confirmDeletePost}
                title="Eliminar Artículo"
                message={`¿Estás seguro de que quieres eliminar el artículo "${postToDelete?.title}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="danger"
                isProcessing={isDeleting}
            />
        </div>
    );
};

export default App;