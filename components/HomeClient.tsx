"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { slugify } from "@/lib/slugify";
import type { Garment } from "@/types/Garment";
import type { FaqItem } from "@/types/FaqItem";
import type { Post } from "@/types/post";
import { useProducts } from "@/hooks/useProducts";
import { usePosts } from "@/hooks/usePosts";
import { useFaqs } from "@/hooks/useFaqs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VideoModal from "@/components/product/VideoModal";
import AdminFormModal from "@/components/modals/AdminFormModal";
import AccessCodeModal from "@/components/AccessCodeModal";
import BulkUploadModal from "@/components/BulkUploadModal";
import Pagination from "@/components/Pagination";
import FaqAccordion from "@/components/FaqAccordion";
import FaqModal from "@/components/FaqModal";
import PostFormModal from "@/components/PostFormModal";
import CatalogToolbar from "@/components/CatalogToolbar";
import ConfirmationModal from "@/components/ConfirmationModal";
import Blog from "@/components/Blog";
import WhatsappModal from "@/components/WhatsappModal";
import VideoCard from "@/components/VideoCard";
import { faqData } from "@/lib/faqData";
import { PlusIcon } from "@/components/Icons";
import { useAuth } from "@/hooks/useAuth";

// Recibe los datos iniciales como props
export default function HomeClient({
  initialGarments,
  initialPosts,
  initialFaqs
}: {
  initialGarments: Garment[];
  initialPosts: Post[];
  initialFaqs: FaqItem[];
}) {
  const processedSlugRef = useRef<string | null>(null);
  const [garments, setGarments] = useState<Garment[]>(initialGarments);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [faqsLocal, setFaqsLocal] = useState<FaqItem[]>(initialFaqs);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAccessCodeModalOpen, setIsAccessCodeModalOpen] = useState(false);
  const [accessCodeError, setAccessCodeError] = useState<string | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingGarment, setEditingGarment] = useState<Garment | null>(null);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [faqModalMode, setFaqModalMode] = useState<"create" | "edit" | "delete">("create");
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ brand: "all", size: "all", color: "all" });
  const [currentPage, setCurrentPage] = useState(1);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set<number>());
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [isProductDeleteModalOpen, setIsProductDeleteModalOpen] = useState(false);
  const [garmentToDelete, setGarmentToDelete] = useState<Garment | null>(null);
  const [isBulkDeleteConfirmation, setIsBulkDeleteConfirmation] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const { authenticated, onLogout, onLogin } = useAuth();
  const { fetchProducts, fetchProductById, deleteProduct } = useProducts();
  const { fetchPosts } = usePosts();
  const { deletePost } = usePosts();
  const { fetchFaqs, faqs: allFaqs } = useFaqs(initialFaqs);
  const ITEMS_PER_PAGE = 10;
  const POSTS_PER_PAGE = 6;
  const FAQ_LIMIT = Number(process.env.NEXT_PUBLIC_FAQ_LIMIT) || 5;

  const handleSelectGarment = useCallback((garment: Garment) => {
    setSelectedGarment(garment);
    setGarments((prev) => {
      const currentGarments = Array.isArray(prev) ? prev : [];
      const exists = currentGarments.some((g) => g.id === garment.id);
      if (exists) {
        return currentGarments.map((g) => (g.id === garment.id ? garment : g));
      }
      return currentGarments;
    });
    if (garment.slug) {
      const newPath = `/${garment.slug}`;
      window.history.pushState(null, "", `#${newPath}`);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedGarment(null);
    if (window.location.hash.startsWith("#/")) {
      window.history.pushState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  const handleSelectGarmentWrapper = useCallback(async (garment: Garment) => {
    // If we're already loading a product, or a modal is open, do nothing.
    if (isProductLoading || (selectedGarment && selectedGarment.id === garment.id)) return;

    setIsProductLoading(true);
    try {
      // Use the logic that was previously in VideoCard
      const fullGarment = await fetchProductById(garment.id);

      const garmentWithSlug = {
        ...(fullGarment || garment),
        videoUrl: fullGarment?.videoUrl || garment.videoUrl,
        slug: fullGarment?.slug || garment.slug,
      };

      handleSelectGarment(garmentWithSlug);
    } catch (error) {
      console.error("Error fetching product details:", error);
      // Fallback: open with what we have
      handleSelectGarment(garment);
    } finally {
      setIsProductLoading(false);
    }
  }, [isProductLoading, selectedGarment, fetchProductById, handleSelectGarment]);

  const sortByCreatedAt = <T extends { created_at: string }>(items: T[]): T[] => {
    return [...items].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      if (isNaN(dateA)) return 1;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (isNaN(dateB)) return -1;
      return dateB - dateA;
    });
  };
  const filteredGarments = useMemo(() => {
    return garments.filter((garment) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        garment.title.toLowerCase().includes(searchLower) ||
        garment.brand.toLowerCase().includes(searchLower) ||
        (garment.description?.toLowerCase().includes(searchLower) ?? false);
      const matchesBrand = filters.brand === "all" || garment.brand === filters.brand;
      const matchesSize = filters.size === "all" || garment.size === filters.size;
      const matchesColor = filters.color === "all" || garment.color === filters.color;
      return matchesSearch && matchesBrand && matchesSize && matchesColor;
    });
  }, [garments, searchQuery, filters]);
  const totalPages = 1;
  const uniqueFilters = useMemo(() => {
    const getUnique = (arr: (string | undefined | null)[]) =>
      [...new Set(arr.filter(v => v != null).map(v => String(v).trim()))].filter(Boolean).sort();

    return {
      brands: getUnique(garments.map((g) => g.brand)),
      sizes: getUnique(garments.map((g) => g.size)),
      colors: getUnique(garments.map((g) => g.color)),
    };
  }, [garments]);
  const handleFilterChange = useCallback((newFilters: { brand?: string; size?: string; color?: string }) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  }, []);
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };
  const handleClearFilters = useCallback(() => {
    setFilters({ brand: "all", size: "all", color: "all" });
    setSearchQuery("");
    setCurrentPage(1);
  }, []);
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      fetchProducts({ page, limit: ITEMS_PER_PAGE }).then((newGarments) => {
        if (Array.isArray(newGarments)) setGarments(newGarments);
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const handleToggleAdmin = async () => {
    if (authenticated) {
      try {
        onLogout();
        setIsSelectionMode(false);
        setSelectedIds(new Set());
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (/401|credencial|credenciales inválidas|invalid/i.test(errorMessage)) {
        setAccessCodeError("Correo o contraseña incorrectos. Inténtalo de nuevo.");
      } else {
        setAccessCodeError(errorMessage);
      }
    } finally {
      setIsLoginLoading(false);
    }
  };


  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash;
      if (!hash || !hash.startsWith("#/")) {
        processedSlugRef.current = null;
        return;
      }

      const slug = hash.replace("#/", "");
      if (!slug || slug === "/" || slug === "blog" || slug.startsWith("blog/")) {
        processedSlugRef.current = null;
        return;
      }

      // Prevent duplicate processing
      if (processedSlugRef.current === slug) return;
      processedSlugRef.current = slug;

      console.log("[HomeClient] Processing deep link for slug:", slug);

      // 1. Try to find in current list
      const foundInList = garments.find(g => g.slug === slug || slugify(g.title, g.id) === slug);
      if (foundInList) {
        handleSelectGarmentWrapper(foundInList);
        return;
      }

      // 2. Extract ID from slug (it ends with -ID)
      const idMatch = slug.match(/-(\d+)$/);
      if (idMatch) {
        const id = idMatch[1];
        try {
          const product = await fetchProductById(id);
          if (product) {
            handleSelectGarment(product);
          }
        } catch (e) {
          console.error("[HomeClient] Error opening from deep link:", e);
        }
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [handleSelectGarmentWrapper, fetchProductById]);
  const handleOpenForm = (garment: Garment | null = null) => {
    setEditingGarment(garment);
    setIsFormModalOpen(true);
    if (garment) {
      fetchProductById(garment.id).then((fresh) => {
        if (fresh) {
          setEditingGarment(fresh);
        }
      });
    }
  };
  const handleSaveGarment = async (product: Garment) => {
    try {
      setGarments((prev) => {
        const exists = prev.some((g) => g.id === product.id);
        const newGarments = exists
          ? prev.map((g) => (g.id === product.id ? product : g))
          : [product, ...prev];
        return sortByCreatedAt(newGarments);
      });
      fetchProducts({ page: currentPage, limit: ITEMS_PER_PAGE }).then((newGarments) => {
        if (Array.isArray(newGarments)) setGarments(newGarments);
      });
      setEditingGarment(null);
      setIsFormModalOpen(false);
    } catch (err: any) {
      console.error("Failed to process saved garment:", err);
    }
  };
  const handleBulkSaveComplete = (newGarments: Garment[]) => {
    // Primero actualizamos localmente para feedback instantáneo
    setGarments((prev) => sortByCreatedAt([...newGarments, ...prev]));
    setIsBulkUploadModalOpen(false);

    // Luego refrescamos del servidor para asegurar que IDs, slugs y fechas estén sincronizados
    fetchProducts({ page: 1, limit: ITEMS_PER_PAGE }).then((freshGarments) => {
      if (Array.isArray(freshGarments)) {
        setGarments(freshGarments);
        setCurrentPage(1);
      }
    });
  };
  const handleToggleSelectionMode = () => {
    if (!authenticated) return;
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds(new Set());
  };
  const handleToggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setIsBulkDeleteConfirmation(true);
    setIsProductDeleteModalOpen(true);
  };

  const handleDeleteProduct = (garment: Garment) => {
    setGarmentToDelete(garment);
    setIsProductDeleteModalOpen(true);
  };

  const confirmDeleteProduct = async () => {
    setIsDeletingProduct(true);
    try {
      if (isBulkDeleteConfirmation) {
        // Borrado masivo
        const idsArray = Array.from(selectedIds);
        // El API actualmente solo soporta uno por uno, así que iteramos
        for (const id of idsArray) {
          await deleteProduct(id);
        }
        setGarments((prev) => prev.filter((g) => !selectedIds.has(g.id)));
        setSelectedIds(new Set());
        setIsSelectionMode(false);
      } else if (garmentToDelete) {
        // Borrado individual
        await deleteProduct(garmentToDelete.id);
        setGarments((prev) => prev.filter((g) => g.id !== garmentToDelete.id));
      }

      setIsProductDeleteModalOpen(false);
      setGarmentToDelete(null);
      setIsBulkDeleteConfirmation(false);
    } catch (err: any) {
      console.error("Failed to delete product(s):", err);
      alert("Hubo un error al eliminar. Por favor intenta de nuevo.");
    } finally {
      setIsDeletingProduct(false);
    }
  };
  const handleOpenPostModal = (post: Post | null = null) => {
    setEditingPost(post);
    setIsPostModalOpen(true);
  };
  const handleSavePost = (post: Post) => {
    setPosts((prev) => {
      const currentPosts = Array.isArray(prev) ? prev : [];
      console.log("Current posts:", currentPosts);
      const exists = currentPosts.some((p) => Number(p.id) === Number(post.id));
      console.log("Saving post:", post, "Exists:", exists);
      if (exists) {
        return currentPosts.map((p) =>
          Number(p.id) === Number(post.id) ? post : p
        );
      }
      console.log("Adding new post:", post);
      return [post, ...currentPosts];
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
      await deletePost(postToDelete.id);

      setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));

      setIsDeleteModalOpen(false);
      setPostToDelete(null);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Error al eliminar el artículo");
    } finally {
      setIsDeleting(false);
    }
  };
  const handleReorderFaqs = useCallback(
    async (newOrder: FaqItem[]) => {
      setFaqsLocal(newOrder);
      try {
        const updatePromises = newOrder
          .filter((item) => {
            const original = allFaqs.find((f: FaqItem) => f.id === item.id);
            return original && original.orden !== item.orden;
          })
          .map((item) =>
            fetch('/api/faqs', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: item.id, orden: item.orden }),
            })
          );
        if (updatePromises.length > 0) {
          await Promise.all(updatePromises);
          await fetchFaqs(true, true, {
            limit: FAQ_LIMIT,
            estado: "activa",
            order: "asc",
          });
        }
      } catch (err) {
        await fetchFaqs(true, true, {
          limit: FAQ_LIMIT,
          estado: "activa",
          order: "asc",
        });
      }
    },
    [allFaqs, fetchFaqs],
  );
  return (
    <div className="bg-stone-50 dark:bg-stone-900 min-h-screen font-sans text-stone-900 dark:text-stone-100 transition-colors">
      <Header
        isAdmin={authenticated}
        onToggleAdmin={handleToggleAdmin}
        navigate={() => window.location.href = "/"}
      />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-80">
        {isLoading && garments.length === 0 && (
          <p className="text-center text-lg text-stone-500 dark:text-stone-400 py-16">
            Cargando...
          </p>
        )}
        {error && (
          <p className="text-center text-lg text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-4 rounded-md whitespace-pre-wrap">
            {error}
          </p>
        )}
        {!isLoading && !error && (
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
                {filteredGarments.map((garment) => (
                  <VideoCard
                    key={garment.id}
                    garment={garment}
                    onSelect={handleSelectGarmentWrapper}
                    isAdmin={authenticated}
                    onEdit={handleOpenForm}
                    onDelete={handleDeleteProduct}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedIds.has(garment.id)}
                    onToggleSelection={handleToggleSelection}
                    isDisabled={isProductLoading || !!selectedGarment}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-lg text-stone-500 dark:text-stone-400 py-16">
                No se encontraron prendas que coincidan con tu búsqueda.
              </p>
            )}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
            <section className="mt-24">
              <Blog
                posts={posts}
                navigate={() => window.location.href = "/"}
                isAdmin={authenticated}
                onAddPost={() => handleOpenPostModal(null)}
                onEditPost={handleOpenPostModal}
                onDeletePost={handleDeletePost}
              />
            </section>
            <section className="mt-24 max-w-4xl mx-auto">
              <header className="flex flex-col items-center text-center mb-12 gap-4">
                <h1 className="text-5xl md:text-6xl font-semibold text-stone-900 dark:text-stone-100 tracking-wider">
                  Preguntas Frecuentes
                </h1>
                <p className="mt-4 text-lg text-stone-500 dark:text-stone-400 max-w-2xl mx-auto">
                  Estamos aquí para ayudarte. Encuentra las respuestas a las preguntas más comunes de nuestra comunidad y compra con total confianza.
                </p>
                {authenticated && (
                  <button
                    onClick={() => {
                      setFaqModalMode("create");
                      setEditingFaq(null);
                      setIsFaqModalOpen(true);
                    }}
                    className="inline-flex mt-8 items-center gap-2 bg-stone-800 dark:bg-stone-700 text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-600 active:bg-stone-900 dark:active:bg-stone-800 transition-all duration-200 text-sm shadow-md hover:shadow-lg cursor-pointer"
                  >
                    <PlusIcon className="w-4 h-4" />
                    <span>Agregar pregunta</span>
                  </button>
                )}
              </header>
              <FaqAccordion
                items={allFaqs.length > 0 ? allFaqs : faqData}
                isAdmin={authenticated}
                onEdit={(faq) => {
                  const fullFaq = (allFaqs.find((f) => f.id === faq.id) || faq) as FaqItem;
                  setEditingFaq(fullFaq);
                  setFaqModalMode("edit");
                  setIsFaqModalOpen(true);
                }}
                onDelete={(faq) => {
                  const fullFaq = (allFaqs.find((f) => f.id === faq.id) || faq) as FaqItem;
                  setEditingFaq(fullFaq);
                  setFaqModalMode("delete");
                  setIsFaqModalOpen(true);
                }}
                onReorder={handleReorderFaqs}
              />
            </section>
          </>
        )}
      </main>
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
      <VideoModal
        isOpen={!!selectedGarment}
        garment={selectedGarment || undefined}
        onClose={handleCloseModal}
        garmentList={filteredGarments}
        onChangeGarment={handleSelectGarment}
      />
      <AccessCodeModal
        isOpen={isAccessCodeModalOpen}
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
      <AdminFormModal
        isOpen={isFormModalOpen}
        garment={editingGarment}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveGarment}
      />
      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onBulkSaveComplete={handleBulkSaveComplete}
      />
      <WhatsappModal
        isOpen={isWhatsappModalOpen}
        onClose={() => setIsWhatsappModalOpen(false)}
      />
      <PostFormModal
        isOpen={isPostModalOpen}
        post={editingPost}
        onClose={() => setIsPostModalOpen(false)}
        onSave={handleSavePost}
      />
      <FaqModal
        isOpen={isFaqModalOpen}
        mode={faqModalMode}
        faq={editingFaq}
        onClose={() => {
          setIsFaqModalOpen(false);
          setEditingFaq(null);
        }}
        onSuccess={() => {
          fetchFaqs(true, true, {
            limit: FAQ_LIMIT,
            estado: "activa",
            order: "asc",
          }).catch((err) => {
            console.warn("Error al recargar preguntas frecuentes:", err);
          });
        }}
      />
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
      <ConfirmationModal
        isOpen={isProductDeleteModalOpen}
        onClose={() => {
          setIsProductDeleteModalOpen(false);
          setGarmentToDelete(null);
          setIsBulkDeleteConfirmation(false);
        }}
        onConfirm={confirmDeleteProduct}
        title={isBulkDeleteConfirmation ? "Eliminar productos" : "Eliminar producto"}
        message={
          <div className="space-y-2">
            <p>
              {isBulkDeleteConfirmation
                ? `¿Estás seguro de que quieres eliminar las ${selectedIds.size} prendas seleccionadas?`
                : `¿Estás seguro de que quieres eliminar el producto "${garmentToDelete?.title}"?`}
            </p>
            <span className="text-sm text-red-500 font-medium block">
              Esta acción no se puede deshacer
            </span>
          </div>
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isProcessing={isDeletingProduct}
      />
    </div>
  );
}
