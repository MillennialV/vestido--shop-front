"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import type { Garment } from "@/types/Garment";
import type { FaqItem } from "@/types/FaqItem";
import type { Post } from "@/types/post";
import { useProducts } from "@/hooks/useProducts";
import { useFaqs } from "@/hooks/useFaqs";
import { usePosts } from "@/hooks/usePosts";
import { getFriendlySupabaseError } from "@/lib/errorUtils";
import { useAuth } from "@/hooks/useAuth";
import { azureStorageService } from "@/services/azureStorageService";
import { preguntasService } from "@/services/faqService";
import { PlusIcon } from "@/components/Icons";

const ITEMS_PER_PAGE = 10;
const POSTS_PER_PAGE = 6;
const FAQ_LIMIT = Number(process.env.NEXT_PUBLIC_FAQ_LIMIT) || 5;

const sortByCreatedAt = <T extends { created_at: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    if (isNaN(dateA)) return 1;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (isNaN(dateB)) return -1;
    return dateB - dateA;
  });
};

export default function Home() {
  const [faqsLocal, setFaqsLocal] = useState<FaqItem[]>([]);
  const { authenticated, onLogout, onLogin } = useAuth();
  const {
    products: garments,
    pagination,
    selectedProduct: selectedGarment,
    setSelectedProduct: setSelectedGarment,
    isLoading: isGarmentsLoading,
    error: garmentsError,
    fetchProducts,
    fetchProductById,
    setProducts: setGarments,
  } = useProducts();
  const {
    posts,
    isLoading: isPostsLoading,
    error: postsError,
    fetchPosts,
    setPosts,
  } = usePosts();
  const { faqsForComponent, fetchFaqs, faqs } = useFaqs();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (faqsForComponent && faqsForComponent.length > 0) {
      setFaqsLocal(faqsForComponent as FaqItem[]);
    }
  }, [faqsForComponent]);

  const [isAccessCodeModalOpen, setIsAccessCodeModalOpen] = useState(false);
  const [accessCodeError, setAccessCodeError] = useState<string | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingGarment, setEditingGarment] = useState<Garment | null>(null);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [faqModalMode, setFaqModalMode] = useState<
    "create" | "edit" | "delete"
  >("create");
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    brand: "all",
    size: "all",
    color: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set<number>());

  const router = useRouter();

  const navigate = useCallback(
    (path: string) => {
      try {
        router.push(path);
      } catch (e) {
        // fallback to full navigation
        window.location.href = path;
      }
    },
    [router],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleHashNavigation = () => {
      const h = window.location.hash;
      if (h && h.startsWith("#/")) {
        const path = h.slice(1);
        try {
          // Only navigate if pathname differs
          if (window.location.pathname + window.location.search !== path) {
            router.push(path);
          }
          // Remove the hash from the URL to keep clean path
          history.replaceState(null, "", path);
        } catch (e) {
          // ignore navigation errors
          console.error("Hash navigation error", e);
        }
      }
    };

    handleHashNavigation();
    window.addEventListener("hashchange", handleHashNavigation);
    return () => window.removeEventListener("hashchange", handleHashNavigation);
  }, [router]);

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [fetchedGarments, fetchedFaqs] = await Promise.all([
          fetchProducts({ page: 1, limit: ITEMS_PER_PAGE }),
          fetchFaqs(true, false, {
            limit: FAQ_LIMIT,
            estado: "activa",
            order: "asc",
          }).catch((err) => []),
          fetchPosts({ page: 1, limit: POSTS_PER_PAGE }).catch((err) => []),
        ]);
      } catch (err: any) {
        setError(getFriendlySupabaseError(err));
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const filteredGarments = useMemo(() => {
    return garments.filter((garment) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        garment.title.toLowerCase().includes(searchLower) ||
        garment.brand.toLowerCase().includes(searchLower) ||
        (garment.description?.toLowerCase().includes(searchLower) ?? false);

      const matchesBrand =
        filters.brand === "all" || garment.brand === filters.brand;
      const matchesSize =
        filters.size === "all" || garment.size === filters.size;
      const matchesColor =
        filters.color === "all" || garment.color === filters.color;

      return matchesSearch && matchesBrand && matchesSize && matchesColor;
    });
  }, [garments, searchQuery, filters]);

  const totalPages = pagination.totalPages || 1;

  const uniqueFilters = useMemo(() => {
    const brands = [...new Set(garments.map((g) => g.brand))].sort();
    const sizes = [...new Set(garments.map((g) => g.size))].sort();
    const colors = [...new Set(garments.map((g) => g.color))].sort();
    return { brands, sizes, colors };
  }, [garments]);

  const handleFilterChange = useCallback(
    (newFilters: { brand?: string; size?: string; color?: string }) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
      setCurrentPage(1);
    },
    [],
  );

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
      fetchProducts({ page, limit: ITEMS_PER_PAGE });
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
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Mostrar mensaje amigable para credenciales inválidas
      if (/401|credencial|credenciales inválidas|invalid/i.test(errorMessage)) {
        setAccessCodeError(
          "Correo o contraseña incorrectos. Inténtalo de nuevo.",
        );
      } else {
        setAccessCodeError(errorMessage);
      }
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleSelectGarment = (garment: Garment) => {
    setSelectedGarment(garment);
    setGarments((prev) => {
      const exists = prev.some((g) => g.id === garment.id);
      if (exists) {
        return prev.map((g) => (g.id === garment.id ? garment : g));
      }
      return prev;
    });
    if (garment.slug) {
      const newPath = `/${garment.slug}`;
      window.history.pushState(null, "", `#${newPath}`);
    }
  };

  const handleCloseModal = () => {
    setSelectedGarment(null);
    navigate("/");
  };

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

      fetchProducts({ page: currentPage, limit: ITEMS_PER_PAGE }).catch((err) =>
        console.error("Background fetch failed:", err),
      );

      setEditingGarment(null);
      setIsFormModalOpen(false);
    } catch (err: any) {
      console.error("Failed to process saved garment:", err);
    }
  };

  const handleBulkSaveComplete = (newGarments: Garment[]) => {
    setGarments((prev) => sortByCreatedAt([...newGarments, ...prev]));
    setIsBulkUploadModalOpen(false);
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

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const garmentsToDelete = garments.filter((g) => selectedIds.has(g.id));
    if (
      window.confirm(
        `¿Estás seguro de que quieres eliminar ${selectedIds.size} prendas seleccionadas?`,
      )
    ) {
      try {
        setGarments((prev) => prev.filter((g) => !selectedIds.has(g.id)));
        setSelectedIds(new Set());
        setIsSelectionMode(false);
      } catch (err: any) {
        console.error("Failed to bulk delete garments:", err);
      }
    }
  };

  const handleOpenPostModal = (post: Post | null = null) => {
    setEditingPost(post);
    setIsPostModalOpen(true);
  };

  const handleSavePost = (post: Post) => {
    setPosts((prev) => {
      const exists = prev.some((p) => p.id === post.id);
      if (exists) {
        return prev.map((p) => (p.id === post.id ? post : p));
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
      if (postToDelete.featured_image_url) {
        await azureStorageService.deleteImage(postToDelete.featured_image_url);
      }

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
            const original = faqs.find((f: FaqItem) => f.id === item.id);
            return original && original.orden !== item.orden;
          })
          .map((item) =>
            preguntasService.actualizarPregunta(item.id, { orden: item.orden }),
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
    [faqs, fetchFaqs],
  );

  return (
    <div className="bg-stone-50 dark:bg-stone-900 min-h-screen font-sans text-stone-900 dark:text-stone-100 transition-colors">
      <Header
        isAdmin={authenticated}
        onToggleAdmin={handleToggleAdmin}
        navigate={navigate}
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
                    onSelect={handleSelectGarment}
                    isAdmin={authenticated}
                    onEdit={handleOpenForm}
                    onDelete={() => {
                      setGarments((prev) =>
                        prev.filter((g) => g.id !== garment.id),
                      );
                    }}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedIds.has(garment.id)}
                    onToggleSelection={handleToggleSelection}
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
                navigate={navigate}
                isAdmin={authenticated}
                onAddPost={() => handleOpenPostModal(null)}
                onEditPost={handleOpenPostModal}
                onDeletePost={handleDeletePost}
              />
            </section>

            <section className="mt-24 max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl md:text-4xl font-semibold text-stone-800 dark:text-stone-100">
                  Preguntas Frecuentes
                </h2>
                {authenticated && (
                  <button
                    onClick={() => {
                      setFaqModalMode("create");
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
                    ? faqsLocal.length > 0
                      ? faqsLocal
                      : faqsForComponent
                    : faqsForComponent.length > 0
                      ? faqsForComponent
                      : faqData
                }
                isAdmin={authenticated}
                onEdit={(faq) => {
                  const fullFaq = (faqs.find((f) => f.id === faq.id) ||
                    faq) as FaqItem;
                  setEditingFaq(fullFaq);
                  setFaqModalMode("edit");
                  setIsFaqModalOpen(true);
                }}
                onDelete={(faq) => {
                  const fullFaq = (faqs.find((f) => f.id === faq.id) ||
                    faq) as FaqItem;
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
            fetchFaqs(true, true, {
              limit: FAQ_LIMIT,
              estado: "activa",
              order: "asc",
            }).catch((err) => {
              console.warn("Error al recargar preguntas frecuentes:", err);
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
}
