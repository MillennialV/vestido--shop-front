"use client";
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slugify";
import type { Garment } from "@/types/Garment";
import type { FaqItem } from "@/types/FaqItem";
import type { Post } from "@/types/post";
import { useProducts } from "@/hooks/useProducts";
import { usePosts } from "@/hooks/usePosts";
import { useFaqs } from "@/hooks/useFaqs";
import Header from "@/components/Header";
import FilterBar from "@/components/FilterBar";
import VideoModal from "@/components/product/VideoModal";
import ImageCarousel from "@/components/ImageCarousel";


const AdminFormModal = dynamic(() => import("@/components/modals/AdminFormModal"), { ssr: false });
const AccessCodeModal = dynamic(() => import("@/components/AccessCodeModal"), { ssr: false });
const BulkUploadModal = dynamic(() => import("@/components/BulkUploadModal"), { ssr: false });
const FaqModal = dynamic(() => import("@/components/FaqModal"), { ssr: false });
const PostFormModal = dynamic(() => import("@/components/PostFormModal"), { ssr: false });
const WhatsappModal = dynamic(() => import("@/components/WhatsappModal"), { ssr: false });
const QrBatchConfigModal = dynamic(() => import("@/components/QrBatchConfigModal"), { ssr: false });
const DownloadAllModal = dynamic(() => import("@/components/modals/DownloadAllModal"), { ssr: false });

import Pagination from "@/components/Pagination";
import FaqAccordion from "@/components/FaqAccordion";
import CatalogToolbar from "@/components/CatalogToolbar";
import ConfirmationModal from "@/components/ConfirmationModal";
import Blog from "@/components/Blog";
import VideoCard from "@/components/VideoCard";
import SiteFooter from "@/components/SiteFooter";
import { faqData } from "@/lib/faqData";
import { PlusIcon } from "@/components/Icons";
import { useAuth } from "@/hooks/useAuth";
import CartModal from "@/components/CartModal";

// Recibe los datos iniciales como props
export default function HomeClient({
  initialGarments,
  initialPagination,
  initialPosts,
  initialFaqs
}: {
  initialGarments: Garment[];
  initialPagination?: any;
  initialPosts: Post[];
  initialFaqs: FaqItem[];
}) {
  const processedSlugRef = useRef<string | null>(null);
  const prevGarmentRef = useRef<Garment | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [faqsLocal, setFaqsLocal] = useState<FaqItem[]>(initialFaqs);
  const [isLoading, setIsLoading] = useState(false);
  const {
    products: garments,
    pagination,
    fetchProducts,
    fetchProductById,
    deleteProduct,
    setProducts,
    isLoading: isProductsLoading
  } = useProducts(initialGarments, initialPagination);
  const [error, setError] = useState<string | null>(null);
  const [isAccessCodeModalOpen, setIsAccessCodeModalOpen] = useState(false);
  const [accessCodeError, setAccessCodeError] = useState<string | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingGarment, setEditingGarment] = useState<Garment | null>(null);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [isQrBatchModalOpen, setIsQrBatchModalOpen] = useState(false);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [faqModalMode, setFaqModalMode] = useState<"create" | "edit" | "delete">("create");
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ brand: "all", size: "all" });
  const [currentPage, setCurrentPage] = useState(1);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Map<number, Garment>>(new Map());
  const [isExporting, setIsExporting] = useState(false);
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const [isProductLoading, setIsProductLoading] = useState(false);
  const [isProductDeleteModalOpen, setIsProductDeleteModalOpen] = useState(false);
  const [garmentToDelete, setGarmentToDelete] = useState<Garment | null>(null);
  const [isBulkDeleteConfirmation, setIsBulkDeleteConfirmation] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [gridColumns, setGridColumns] = useState(3);
  const [isDownloadAllModalOpen, setIsDownloadAllModalOpen] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const { authenticated, onLogout, onLogin } = useAuth();
  const router = useRouter();
  const { fetchPosts, deletePost, posts, pagination: blogPagination, updatePost, createPost, isLoading: isPostLoading, error: postError } = usePosts(initialPosts);
  const { fetchFaqs, faqs: allFaqs } = useFaqs(initialFaqs);
  const ITEMS_PER_PAGE = gridColumns === 5 ? 15 : 12;
  const POSTS_PER_PAGE = 6;
  const FAQ_LIMIT = Number(process.env.NEXT_PUBLIC_FAQ_LIMIT) || 5;

  // Toggle for showing the Image Carousel
  const SHOW_CAROUSEL = true;

  const handleSelectGarment = useCallback((garment: Garment, _updateUrl = true) => {
    setSelectedGarment(garment);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedGarment(null);
  }, []);

  // Sync URL with selected garment without triggering full page re-renders
  useEffect(() => {
    if (selectedGarment) {
      const slug = selectedGarment.slug || slugify(selectedGarment.title, selectedGarment.id);
      const newPath = `/producto/${slug}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState(null, "", newPath);
        processedSlugRef.current = slug;
      }
    } else if (prevGarmentRef.current) {
      // Only clean the URL if we are closing a previously selected garment
      if (window.location.pathname !== "/" && !window.location.pathname.startsWith("/blog")) {
        window.history.pushState(null, "", "/");
        processedSlugRef.current = null;
      }
    }
    prevGarmentRef.current = selectedGarment;
  }, [selectedGarment]);

  const handleSelectGarmentWrapper = useCallback(async (garment: Garment, updateUrl = true) => {
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

      handleSelectGarment(garmentWithSlug, updateUrl);
    } catch (error) {
      console.error("Error fetching product details:", error);
      // Fallback: open with what we have
      handleSelectGarment(garment, updateUrl);
    } finally {
      setIsProductLoading(false);
    }
  }, [isProductLoading, selectedGarment, fetchProductById, handleSelectGarment]);

  useEffect(() => {
    if (!!selectedGarment) {
      setIsRendered(true);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [!!selectedGarment]);


  const sortByCreatedAt = <T extends { created_at: string }>(items: T[]): T[] => {
    return [...items].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      if (isNaN(dateA)) return 1;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (isNaN(dateB)) return -1;
      return dateB - dateA;
    });
  };
  const filteredGarments = garments;
  const totalPages = pagination.totalPages;
  const [allProductsForFilters, setAllProductsForFilters] = useState<Garment[]>([]);

  useEffect(() => {
    const loadAllProductsForFilters = async () => {
      try {
        // Fetch a large number of products to get all available filter options
        // Ideally this should be a dedicated "facets" endpoint, but fetching all works for now
        const res = await fetch('/api/products?limit=1000&sort=created_at&order=desc');
        if (res.ok) {
          const data = await res.json();
          const all = Array.isArray(data) ? data : data.products || [];
          setAllProductsForFilters(all);
        }
      } catch (error) {
        console.error("Error loading filter options:", error);
      }
    };
    loadAllProductsForFilters();
  }, []);

  const uniqueFilters = useMemo(() => {
    const sourceData = allProductsForFilters.length > 0 ? allProductsForFilters : initialGarments;
    const getUnique = (arr: (string | undefined | null)[]) =>
      [...new Set(arr.filter(v => v != null).map(v => String(v).trim()))].filter(Boolean).sort();

    return {
      brands: getUnique(sourceData.map((g) => g.brand)),
      sizes: getUnique(sourceData.map((g) => g.size)),
    };
  }, [allProductsForFilters, initialGarments]);
  const handleFilterChange = useCallback((newFilters: { brand?: string; size?: string }) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    setCurrentPage(1);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    fetchProducts({
      page: 1,
      limit: ITEMS_PER_PAGE,
      ...updatedFilters,
      q: searchQuery
    });
  }, [filters, searchQuery, fetchProducts, ITEMS_PER_PAGE]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchProducts({
        page: 1,
        limit: ITEMS_PER_PAGE,
        ...filters,
        q: query
      });
    }, 800);
  };

  const handleClearFilters = useCallback(() => {
    const defaultFilters = { brand: "all", size: "all" };
    setFilters(defaultFilters);
    setSearchQuery("");
    setCurrentPage(1);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    fetchProducts({
      page: 1,
      limit: ITEMS_PER_PAGE,
      ...defaultFilters,
      q: ""
    });
  }, [fetchProducts, ITEMS_PER_PAGE]);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      fetchProducts({
        page,
        limit: ITEMS_PER_PAGE,
        ...filters,
        q: searchQuery
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleToggleAdmin = async () => {
    if (authenticated) {
      try {
        onLogout();
        setIsSelectionMode(false);
        setSelectedItems(new Map());
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
    const handleUrlChange = async (isPopState = false) => {
      const path = window.location.pathname;
      if (!path || path === "/") {
        if (isPopState) {
          processedSlugRef.current = null;
          setSelectedGarment(null);
        }
        return;
      }
      let slug = path.replace(/^\//, "");
      if (slug.startsWith("producto/")) {
        slug = slug.substring(9);
      }

      if (!slug || slug === "blog" || slug.startsWith("blog/") || slug === "producto") {
        processedSlugRef.current = null;
        return;
      }
      if (processedSlugRef.current === slug) return;
      processedSlugRef.current = slug;
      const foundInList = garments.find(g => g.slug === slug || slugify(g.title, g.id) === slug);
      if (foundInList) {
        handleSelectGarmentWrapper(foundInList, true);
        return;
      }
      const idMatch = slug.match(/-(\d+)$/);
      if (idMatch) {
        const id = idMatch[1];
        try {
          const product = await fetchProductById(id);
          if (product) {
            handleSelectGarment(product, true);
          }
        } catch (e) {
          console.error("[HomeClient] Error opening from deep link:", e);
        }
      }
    };
    handleUrlChange(false);
    const popStateListener = () => handleUrlChange(true);
    window.addEventListener("popstate", popStateListener);
    return () => window.removeEventListener("popstate", popStateListener);
  }, [handleSelectGarmentWrapper, fetchProductById, garments, handleSelectGarment]);

  useEffect(() => {
    const getPosts = async () => {
      await fetchPosts()
    }
    getPosts()
  }, [authenticated, fetchPosts]);

  const handleOpenForm = (garment: Garment | null = null) => {
    setEditingGarment(garment);
    setIsFormModalOpen(true);
    if (garment) {
      fetchProductById(garment.id).then((fresh) => {
        if (fresh) setEditingGarment(fresh);
      });
    }
  };
  const handleSaveGarment = async (product: Garment) => {
    try {
      setProducts((prev) => {
        const exists = prev.some((g) => g.id === product.id);
        const newGarments = exists
          ? prev.map((g) => (g.id === product.id ? product : g))
          : [product, ...prev];
        return sortByCreatedAt(newGarments);
      });
      fetchProducts({ page: currentPage, limit: ITEMS_PER_PAGE });
      setEditingGarment(null);
      setIsFormModalOpen(false);
    } catch (err: any) {
      console.error("Failed to process saved garment:", err);
    }
  };

  const handleBulkSaveComplete = useCallback((newGarments: Garment[]) => {
    setProducts(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const uniqueNew = newGarments.filter(p => !existingIds.has(p.id));
      const sorted = sortByCreatedAt([...uniqueNew, ...prev]);
      return sorted;
    });
    setIsBulkUploadModalOpen(false);
    fetchProducts({ page: 1, limit: ITEMS_PER_PAGE });
    setCurrentPage(1);
  }, [setProducts, ITEMS_PER_PAGE, fetchProducts]);

  const handleToggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (!isSelectionMode) setSelectedItems(new Map());
  };

  const handleToggleSelection = (garment: Garment) => {
    const newSelected = new Map(selectedItems);
    if (newSelected.has(garment.id)) {
      newSelected.delete(garment.id);
    } else {
      newSelected.set(garment.id, garment);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedItems.size === 0) return;
    setIsBulkDeleteConfirmation(true);
    setIsProductDeleteModalOpen(true);
  };

  const handleDeleteProduct = (garment: Garment) => {
    setGarmentToDelete(garment);
    setIsBulkDeleteConfirmation(false);
    setIsProductDeleteModalOpen(true);
  };

  const confirmDeleteProduct = async () => {
    setIsDeletingProduct(true);
    try {
      if (isBulkDeleteConfirmation) {
        const idsArray = Array.from(selectedItems.keys());
        await Promise.all(idsArray.map(id => deleteProduct(id)));
        setProducts(garments.filter(g => !selectedItems.has(g.id)));
        setSelectedItems(new Map());
        setIsSelectionMode(false);
      } else if (garmentToDelete) {
        await deleteProduct(garmentToDelete.id);
        setProducts(garments.filter(g => g.id !== garmentToDelete.id));
      }
      setIsProductDeleteModalOpen(false);
    } catch (error) {
      console.error("Error al eliminar producto:", error);
    } finally {
      setIsDeletingProduct(false);
      setGarmentToDelete(null);
      setIsBulkDeleteConfirmation(false);
    }
  };

  const handleDownloadImages = useCallback(async () => {
    if (selectedItems.size === 0) return;

    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      const selectedGarmentsList = Array.from(selectedItems.values());

      const downloadPromises = selectedGarmentsList.map(async (garment) => {
        const imageUrl = garment.imagen_principal;
        if (!imageUrl) return;

        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();

          // Convert to WebP
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            const objectUrl = URL.createObjectURL(blob);
            img.onload = () => {
              URL.revokeObjectURL(objectUrl);
              resolve(img);
            };
            img.onerror = (err) => {
              URL.revokeObjectURL(objectUrl);
              reject(err);
            };
            img.src = objectUrl;
          });

          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const webpBlob = await new Promise<Blob | null>((resolve) => {
              canvas.toBlob((b) => resolve(b), 'image/webp', 1.0);
            });

            if (webpBlob) {
              const safeDescription = (garment.description || garment.title || "sin-descripcion")
                .substring(0, 20)
                .replace(/\s+/g, '-')
                .replace(/[/\\?%*:|"<>]/g, '-');
              const fileName = `${garment.id}-${garment.size || 'N-A'}-${safeDescription}.webp`;
              zip.file(fileName, webpBlob);
            }
          }
        } catch (error) {
          console.error(`Error procesando imagen para producto ${garment.id}:`, error);
        }
      });

      await Promise.all(downloadPromises);

      if (Object.keys(zip.files).length === 0) {
        alert("No se pudieron procesar las imágenes.");
        return;
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `vestidos-seleccionados-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error al generar el ZIP:", error);
      alert("Error al generar el archivo de descarga.");
    }
  }, [selectedItems, garments]);

  const handleSelectAll = useCallback(() => {
    const newSelected = new Map(selectedItems); // Mantenemos los que ya estaban o empezamos de cero si prefieres deseleccionar el resto
    garments.forEach(p => newSelected.set(p.id, p));
    console.log(newSelected.size);

    setSelectedItems(newSelected);
    setIsSelectionMode(true);
  }, [selectedItems, garments]);

  const handleDeselectAll = useCallback(() => {
    setSelectedItems(new Map());
  }, []);

  const handleExportExcel = useCallback(async () => {
    setIsExporting(true);
    try {
      let productsToExport: Garment[] = [];

      if (selectedItems.size > 0) {
        productsToExport = Array.from(selectedItems.values());
      } else {
        const res = await fetch('/api/products?limit=10000&sort=created_at&order=desc');
        if (!res.ok) throw new Error("Error fetching products for export");
        const data = await res.json();
        productsToExport = Array.isArray(data) ? data : data.products || [];
      }

      if (productsToExport.length === 0) {
        alert("No hay productos para exportar.");
        return;
      }

      // Headers profesionales
      const headers = [
        "ID",
        "Producto",
        "Marca",
        "Talla",
        "Color",
        "Precio",
        "Stock",
        "Material",
        "Ocasión",
        "Descripción",
        "Notas de Estilo",
        "URL Video",
        "URL Imagen",
        "Slug",
        "Fecha de Registro"
      ];

      const rows = productsToExport.map(p => {
        // Formatear fecha de forma legible
        const date = p.created_at ? new Date(p.created_at).toLocaleDateString('es-ES') : 'N/A';

        // Limpiar textos para evitar que rompan el CSV
        const clean = (text: string | undefined | null) =>
          text ? `"${text.replace(/"/g, '""').replace(/\n/g, ' ')}"` : '""';

        return [
          p.id,
          clean(p.title),
          clean(p.brand),
          clean(p.size),
          clean(p.color),
          p.price || 0,
          p.cantidad || 0,
          clean(p.material),
          clean(p.occasion),
          clean(p.description),
          clean(p.style_notes),
          clean(p.videoUrl),
          clean(p.imagen_principal),
          clean(p.slug),
          clean(date)
        ];
      });

      // Usamos punto y coma (;) como separador para mejor compatibilidad con Excel en regiones con coma decimal
      const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `catalogo_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error(error);
      alert("Error al exportar a Excel.");
    } finally {
      setIsExporting(false);
    }
  }, [selectedItems]);

  const handleOpenPostModal = (post: Post | null = null) => {
    setEditingPost(post);
    setIsPostModalOpen(true);
  };

  const handleSavePost = async (id: number, post: any) => {
    if (id) {
      await updatePost(id, post);
    } else {
      await createPost(post);
    }
    await fetchPosts();
    setIsPostModalOpen(false);
  };

  const handleDeletePost = (post: Post) => {
    setPostToDelete(post);
    setIsDeleteModalOpen(true);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      await deletePost(postToDelete);

      // Calcular a quÃ© pÃ¡gina ir tras eliminar
      const isLastItemOnPage = posts.length === 1;
      const currentPage = blogPagination.page;

      let nextPage = currentPage;
      if (isLastItemOnPage && currentPage > 1) {
        nextPage = currentPage - 1;
      }

      // Recargar posts para corregir huecos y paginaciÃ³n
      await fetchPosts({ page: nextPage, limit: POSTS_PER_PAGE });
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error al eliminar el artículo:", error);
      alert("Error al eliminar el artículo");
    } finally {
      setIsDeleting(false);
      setPostToDelete(null);
    }
  };

  const slides = useMemo(() => {
    return filteredGarments
      .filter((garment) => garment.imagen_principal)
      .map((garment) => ({
        id: garment.id,
        imageUrl: garment.imagen_principal as string,
        title: garment.title,
        subtitle: garment.slug,
      }));
  }, [filteredGarments]);

  const handleBlogPageChange = (page: number) => {
    fetchPosts({ page });
  };

  const handleReorderFaqs = useCallback(
    async (newOrder: FaqItem[]) => {
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
    [allFaqs, fetchFaqs, FAQ_LIMIT],
  );

  return (
    <div className="bg-color-four  dark:bg-color-three min-h-screen font-sans text-stone-900 dark:text-stone-100 transition-colors">
      <Header
        isAdmin={authenticated}
        onToggleAdmin={handleToggleAdmin}
        navigate={(path) => window.location.href = path}
        isFilterVisible={isFilterVisible}
        onToggleFilters={() => setIsFilterVisible(!isFilterVisible)}
        brands={uniqueFilters.brands}
        sizes={uniqueFilters.sizes}
        filters={filters}
        onFilterChange={handleFilterChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />
      <main className="mx-[12px] fd:mx-[23px] fd:mx-auto fd:max-w-[1290px] bg-color-background dark:bg-color-background-dark rounded-[21px] my-5 px-[26px] py-[30px]">
        {SHOW_CAROUSEL && (
          <ImageCarousel
            slides={slides} autoPlayInterval={5000} />
        )}


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
            <div id="catalogo">
              {authenticated && (
                <CatalogToolbar
                  onAddGarment={() => handleOpenForm(null)}
                  onBulkUpload={() => setIsBulkUploadModalOpen(true)}
                  onToggleSelectionMode={handleToggleSelectionMode}
                  isSelectionMode={isSelectionMode}
                  selectedCount={selectedItems.size}
                  onBulkDelete={handleBulkDelete}
                  onWhatsapp={() => setIsWhatsappModalOpen(true)}
                  onGenerateQr={() => setIsQrBatchModalOpen(true)}
                  onDownloadImages={handleDownloadImages}
                  onDownloadAll={() => setIsDownloadAllModalOpen(true)}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onExportExcel={handleExportExcel}
                  isExportingExcel={isExporting}
                />
              )}
              <FilterBar
                brands={uniqueFilters.brands}
                sizes={uniqueFilters.sizes}
                filters={filters}
                onFilterChange={handleFilterChange}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                isFilterVisible={isFilterVisible}
                onToggleFilters={() => setIsFilterVisible(!isFilterVisible)}
                gridColumns={gridColumns}
                onGridColumnsChange={(cols) => {
                  setGridColumns(cols);
                  const newLimit = cols === 5 ? 15 : 12;
                  const currentLimit = gridColumns === 5 ? 15 : 12;
                  if (newLimit !== currentLimit) {
                    setCurrentPage(1);
                    fetchProducts({
                      page: 1,
                      limit: newLimit,
                      ...filters,
                      q: searchQuery
                    });
                  }
                }}
              />

              {filteredGarments.length > 0 ? (
                <div className={`grid grid-cols-1 transition-all duration-300 ${gridColumns === 2 ? "md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8 md:gap-12" :
                  gridColumns === 3 ? "md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-8 md:gap-12" :
                    gridColumns === 4 ? "md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6 md:gap-8" :
                      "md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
                  }`}>
                  {filteredGarments.map((garment, index) => (
                    <VideoCard
                      key={garment.id}
                      garment={garment}
                      onSelect={handleSelectGarmentWrapper}
                      isAdmin={authenticated}
                      onEdit={handleOpenForm}
                      onDelete={handleDeleteProduct}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedItems.has(garment.id)}
                      onToggleSelection={handleToggleSelection}
                      isDisabled={isProductLoading || !!selectedGarment}
                      priority={index < 6}
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
              <section id="blog" className="mt-24">
                <Blog
                  posts={posts}
                  navigate={() => window.location.href = "/"}
                  onAddPost={() => handleOpenPostModal(null)}
                  onEditPost={handleOpenPostModal}
                  onDeletePost={handleDeletePost}
                  isLoading={isPostLoading}
                  pagination={{
                    page: blogPagination.page,
                    hasNextPage: blogPagination.hasNextPage,
                    onPageChange: handleBlogPageChange
                  }}
                />
              </section>
              <section id="faq" className="mt-24 mb-[100px] max-w-4xl mx-auto">
                <header className="flex flex-col items-center text-center mb-12 gap-[24px]">
                  <h1 className="font-h1">
                    Preguntas Frecuentes
                  </h1>
                  <p className="mt-4 font-p max-w-2xl mx-auto">
                    Este es un espacio creado para ti. Aquí respondemos las dudas más frecuentes de nuestra comunidad con total confianza, transparencia y compromiso
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
            </div>
          </>
        )}
      </main>
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
      <QrBatchConfigModal
        isOpen={isQrBatchModalOpen}
        onClose={() => setIsQrBatchModalOpen(false)}
        garments={Array.from(selectedItems.values())}
      />
      <DownloadAllModal
        isOpen={isDownloadAllModalOpen}
        onClose={() => setIsDownloadAllModalOpen(false)}
        isDownloading={isDownloadingAll}
        onConfirm={async () => {
          setIsDownloadingAll(true);
          try {
            // 1. Obtener TODOS los productos sin paginación
            const res = await fetch('/api/products?limit=10000&sort=created_at&order=desc');
            if (!res.ok) throw new Error("Error al obtener productos");
            const data = await res.json();
            const allProducts: Garment[] = Array.isArray(data) ? data : data.products || [];

            if (allProducts.length === 0) {
              alert("No hay productos para descargar.");
              return;
            }

            // 2. Importar dinamico de jszip para consistencia
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            const imgFolder = zip.folder("imagenes_catalogo");
            if (!imgFolder) throw new Error("Error ZIP");

            // Helper function for slugify
            const slugify = (text: string, id: number) => {
              const baseSlug = text
                .toString()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '')
                .replace(/--+/g, '-');
              return `${baseSlug}-${id}`;
            };

            // 3. Descargar imágenes
            const downloadPromises = allProducts
              .filter(p => !!p.imagen_principal)
              .map(async (p) => {
                try {
                  const imgUrl = p.imagen_principal as string;
                  const response = await fetch(imgUrl);
                  if (!response.ok) return;
                  const blob = await response.blob();

                  // Regla: slug o titulo
                  const currentSlug = p.slug || slugify(p.title, p.id);
                  const extension = imgUrl.split('.').pop()?.split(/[?#]/)[0] || 'jpg';
                  imgFolder.file(`${currentSlug}.${extension}`, blob);
                } catch (err) {
                  console.error(`Error descargando imagen ${p.id}:`, err);
                }
              });

            await Promise.all(downloadPromises);

            // 4. Generar y disparar descarga
            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const link = document.createElement("a");
            link.href = url;
            link.download = `catalogo_completo_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setIsDownloadAllModalOpen(false);
          } catch (error) {
            console.error("Error descarga masiva:", error);
            alert("Error al procesar la descarga masiva.");
          } finally {
            setIsDownloadingAll(false);
          }
        }}
      />
      <PostFormModal
        isOpen={isPostModalOpen}
        post={editingPost}
        onClose={() => setIsPostModalOpen(false)}
        onSubmit={handleSavePost}
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
                ? `¿Estás seguro de que quieres eliminar las ${selectedItems.size} prendas seleccionadas?`
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
      <SiteFooter />
    </div>
  );
}
