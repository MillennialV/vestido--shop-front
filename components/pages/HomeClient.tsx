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
import { useRemoteTheme } from "@/context/RemoteThemeContext";
import Header from "@/components/layout/Header";
import FilterBar from "@/components/catalog/FilterBar";
import VideoModal from "@/components/modals/VideoModal";
import ImageCarousel from "@/components/product/ImageCarousel";
import { useBanners, Banner } from "@/hooks/useBanners";


const AdminFormModal = dynamic(() => import("@/components/modals/AdminFormModal"), { ssr: false });
const AccessCodeModal = dynamic(() => import("@/components/modals/AccessCodeModal"), { ssr: false });
const BulkUploadModal = dynamic(() => import("@/components/modals/BulkUploadModal"), { ssr: false });
const FaqModal = dynamic(() => import("@/components/faq/FaqModal"), { ssr: false });
const PostFormModal = dynamic(() => import("@/components/blog/PostFormModal"), { ssr: false });
const WhatsappModal = dynamic(() => import("@/components/modals/WhatsappModal"), { ssr: false });
const QrBatchConfigModal = dynamic(() => import("@/components/modals/QrBatchConfigModal"), { ssr: false });
const DownloadAllModal = dynamic(() => import("@/components/modals/DownloadAllModal"), { ssr: false });
const BannerUploadModal = dynamic(() => import("@/components/modals/BannerUploadModal"), { ssr: false });
const BannerEditModal = dynamic(() => import("@/components/modals/BannerEditModal"), { ssr: false });
const FilterConfigModal = dynamic(() => import("@/components/modals/FilterConfigModal"), { ssr: false });
const CategoryManagerModal = dynamic(() => import("@/components/blog/CategoryManagerModal"), { ssr: false });
import { BannerUploadItem } from "@/components/modals/BannerUploadModal";

import Pagination from "@/components/ui/Pagination";
import FaqAccordion from "@/components/faq/FaqAccordion";
import CatalogToolbar from "@/components/catalog/CatalogToolbar";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import Blog from "@/components/blog/Blog";
import VideoCard from "@/components/cards/VideoCard";
import SiteFooter from "@/components/layout/SiteFooter";
import {
  CircleIcon,
  CheckCircleIcon,
  PlusIcon,
  SearchIcon,
  SpinnerIcon
} from "@/components/ui/Icons";
import { useAuth } from "@/hooks/useAuth";
import CartModal from "@/components/modals/CartModal";

// Ref persistente fuera del componente para evitar doble ejecución en StrictMode (desarrollo)
const globalProcessedSlugRef = { current: null as string | null };

// Recibe los datos iniciales como props
export default function HomeClient({
  initialGarments,
  initialPagination,
  initialPosts,
  initialFaqs,
  seoTitle
}: {
  initialGarments: Garment[];
  initialPagination?: any;
  initialPosts: Post[];
  initialFaqs: FaqItem[];
  seoTitle?: string;
}) {
  // const processedSlugRef = useRef<string | null>(null); // Movido a global
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

  const { banners, fetchBanners, uploadBanner, deleteBanner, updateBanner } = useBanners();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);
  const [isBannerUploadModalOpen, setIsBannerUploadModalOpen] = useState(false);
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
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>(['brand']);
  const [filters, setFilters] = useState<Record<string, string>>({ brand: "all" });
  const [isFilterConfigModalOpen, setIsFilterConfigModalOpen] = useState(false);
  const [allProductsForFilters, setAllProductsForFilters] = useState<Garment[]>([]);

  // Obtener configuración de filtros al montar
  useEffect(() => {
    const loadFilterConfig = async () => {
      try {
        const res = await fetch('/api/products/filter-config');
        if (res.ok) {
          const data = await res.json();
          if (data.campos_activos) {
            setActiveFilterKeys(data.campos_activos);
          }
        }
      } catch (error) {
        console.error("Error loading filter config:", error);
      }
    };
    loadFilterConfig();
  }, []);

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
  // Detectar todos los atributos dinámicos posibles de TODOS los productos disponibles
  const availableAttributes = useMemo(() => {
    const keys = new Set<string>();
    keys.add('brand');

    const sourceData = allProductsForFilters.length > 0 ? allProductsForFilters : initialGarments;

    sourceData.forEach(garment => {
      const standardKeys = [
        'id', 'brand', 'title', 'description', 'videoUrl', 'imagen_principal', 'imagenes',
        'price', 'slug', 'cantidad', 'disponible', 'sku', 'estado', 'categoria_id',
        'subcategoria', 'tags', 'precio_original', 'precio_descuento', 'porcentaje_descuento',
        'cantidad_minima', 'ubicacion', 'costo', 'margen_ganancia', 'meta_title',
        'meta_description', 'keywords', 'destacado', 'nuevo', 'codigo_barras',
        'garantia', 'qr', 'sticker', 'created_at', 'updated_at', 'created_by', 'size', 'occasion',
        'category', 'categoria', 'atributos_dinamicos'
      ];

      Object.keys(garment).forEach(key => {
        if (!standardKeys.includes(key)) {
          const lowerK = key.toLowerCase();
          if (lowerK !== 'talla' && lowerK !== 'tallas' && lowerK !== 'sizes') {
            keys.add(key);
          }
        }
      });

      if (garment.occasion) keys.add('occasion');
    });

    return Array.from(keys);
  }, [allProductsForFilters, initialGarments]);

  // Calcular opciones de cada filtro dinámicamente basado en TODOS los productos disponibles
  const filterOptions = useMemo(() => {
    const options: Record<string, Set<string>> = {};
    activeFilterKeys.forEach(key => options[key] = new Set<string>());

    const sourceData = allProductsForFilters.length > 0 ? allProductsForFilters : initialGarments;

    sourceData.forEach((garment: any) => {
      activeFilterKeys.forEach(key => {
        const val = garment[key];
        if (val && val !== '') {
          if (key === 'size') {
            // Dividir por comas para obtener tallas individuales limpias
            String(val).split(',').forEach(s => {
              const cleaned = s.trim();
              if (cleaned) {
                options[key].add(cleaned);
              }
            });
          } else {
            options[key].add(String(val));
          }
        }
      });
    });

    const result: Record<string, string[]> = {};
    Object.keys(options).forEach(key => {
      if (key === 'size') {
        // Ordenación lógica de tallas de menor a mayor
        const sizeOrder = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', '38', '40', '42', '44', 'única', 'unica'];
        result[key] = Array.from(options[key]).sort((a, b) => {
          const idxA = sizeOrder.indexOf(a.toLowerCase());
          const idxB = sizeOrder.indexOf(b.toLowerCase());
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.localeCompare(b);
        });
      } else {
        result[key] = Array.from(options[key]).sort();
      }
    });
    return result;
  }, [allProductsForFilters, initialGarments, activeFilterKeys]);
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
  const { authenticated, onLogout, onLogin, organization, refreshToken } = useAuth();
  const router = useRouter();

  // Console.log para verificar la organización actual del usuario
  useEffect(() => {
    console.log("Datos de Organización actual en HomeClient:", organization);
  }, [organization]);

  const { fetchPosts, deletePost, posts, pagination: blogPagination, updatePost, createPost, isLoading: isPostLoading, error: postError } = usePosts(initialPosts);
  const { fetchFaqs, faqs: allFaqs } = useFaqs(initialFaqs);
  const ITEMS_PER_PAGE = gridColumns === 5 ? 15 : 12;
  const POSTS_PER_PAGE = 6;
  const FAQ_LIMIT = Number(process.env.NEXT_PUBLIC_FAQ_LIMIT) || 5;

  // Dynamic check for showing the Image Carousel
  const { storeInfo } = useRemoteTheme();
  const SHOW_CAROUSEL = storeInfo?.is_carousel_enabled !== false;

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleSelectGarment = useCallback((garment: Garment, _updateUrl = true) => {
    setSelectedGarment(garment);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedGarment(null);
  }, []);

  // Sync URL with selected garment without triggering full page re-renders
  useEffect(() => {
    if (selectedGarment) {
      const slug = selectedGarment.slug || slugify(selectedGarment.title);
      const newPath = `/producto/${slug}`;
      if (window.location.pathname !== newPath) {
        window.history.pushState(null, "", newPath);
        globalProcessedSlugRef.current = slug;
      }
    } else if (prevGarmentRef.current) {
      // Only clean the URL if we are closing a previously selected garment
      if (window.location.pathname !== "/" && !window.location.pathname.startsWith("/blog")) {
        window.history.pushState(null, "", "/");
        globalProcessedSlugRef.current = null;
      }
    }
    prevGarmentRef.current = selectedGarment;
  }, [selectedGarment]);

  // Redirigir al panel si el usuario está autenticado pero no tiene organización
  useEffect(() => {
    if (authenticated && !organization) {
      router.push("/panel");
    }
  }, [authenticated, organization, router]);

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
  const filteredGarments = useMemo(() => {
    // Si NO hay filtros ni búsqueda, usamos tal cual lo que viene del hook (paginado por API)
    const hasActiveFilters = Object.values(filters).some(v => v !== 'all') || searchQuery !== "";

    if (!hasActiveFilters) {
      return garments;
    }

    // Si HAY filtros, intentamos el filtrado local sobre todos los productos
    const sourceData = allProductsForFilters.length > 0 ? allProductsForFilters : initialGarments;

    const filtered = sourceData.filter(g => {
      // Filtrar por Marca
      if (filters.brand && filters.brand !== 'all') {
        if (g.brand !== filters.brand) return false;
      }

      // Filtrar por otros atributos dinámicos activos
      for (const key of activeFilterKeys) {
        if (key === 'brand') continue;
        const filterVal = filters[key];
        if (filterVal && filterVal !== 'all') {
          if (key === 'size') {
            const productSizes = String(g.size || '').split(',').map(s => s.trim().toLowerCase());
            if (!productSizes.includes(filterVal.trim().toLowerCase())) return false;
          } else {
            if (String((g as any)[key]) !== filterVal) return false;
          }
        }
      }

      // Filtrar por búsqueda de texto
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          g.title?.toLowerCase().includes(q) ||
          g.description?.toLowerCase().includes(q) ||
          g.brand?.toLowerCase().includes(q)
        );
      }

      return true;
    });

    // Paginación local
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [garments, allProductsForFilters, initialGarments, filters, searchQuery, currentPage, ITEMS_PER_PAGE, activeFilterKeys]);

  const totalPages = useMemo(() => {
    const hasActiveFilters = Object.values(filters).some(v => v !== 'all') || searchQuery !== "";
    if (!hasActiveFilters) return pagination.totalPages;

    const sourceData = allProductsForFilters.length > 0 ? allProductsForFilters : initialGarments;
    const filteredCount = sourceData.filter(g => {
      if (filters.brand && filters.brand !== 'all' && g.brand !== filters.brand) return false;
      for (const key of activeFilterKeys) {
        if (key === 'brand') continue;
        const filterVal = filters[key];
        if (filterVal && filterVal !== 'all') {
          if (key === 'size') {
            const productSizes = String(g.size || '').split(',').map(s => s.trim().toLowerCase());
            if (!productSizes.includes(filterVal.trim().toLowerCase())) return false;
          } else {
            if (String((g as any)[key]) !== filterVal) return false;
          }
        }
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return g.title?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q) || g.brand?.toLowerCase().includes(q);
      }
      return true;
    }).length;

    return Math.ceil(filteredCount / ITEMS_PER_PAGE) || 1;
  }, [pagination.totalPages, allProductsForFilters, initialGarments, filters, searchQuery, ITEMS_PER_PAGE, activeFilterKeys]);

  const totalProducts = useMemo(() => {
    const hasActiveFilters = Object.values(filters).some(v => v !== 'all') || searchQuery !== "";
    if (!hasActiveFilters) return pagination.total;

    const sourceData = allProductsForFilters.length > 0 ? allProductsForFilters : initialGarments;
    return sourceData.filter(g => {
      if (filters.brand && filters.brand !== 'all' && g.brand !== filters.brand) return false;
      for (const key of activeFilterKeys) {
        if (key === 'brand') continue;
        const filterVal = filters[key];
        if (filterVal && filterVal !== 'all') {
          if (key === 'size') {
            const productSizes = String(g.size || '').split(',').map(s => s.trim().toLowerCase());
            if (!productSizes.includes(filterVal.trim().toLowerCase())) return false;
          } else {
            if (String((g as any)[key]) !== filterVal) return false;
          }
        }
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return g.title?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q) || g.brand?.toLowerCase().includes(q);
      }
      return true;
    }).length;
  }, [pagination.total, allProductsForFilters, initialGarments, filters, searchQuery, activeFilterKeys]);
  const onFilterChange = useCallback((newFilter: Record<string, string>) => {
    // 1. Calcular el NUEVO estado completo basado en los filtros actuales y los nuevos
    const updatedFilters = { ...filters, ...newFilter };

    // 2. Actualizar el estado inmediatamente
    setFilters(updatedFilters);
    setCurrentPage(1);

    // 3. Ejecutar la búsqueda con los filtros recién calculados
    fetchProducts({
      page: 1,
      limit: ITEMS_PER_PAGE,
      ...updatedFilters,
      title: searchQuery
    });
  }, [filters, fetchProducts, ITEMS_PER_PAGE, searchQuery]);

  const handleSaveFilterConfig = async (newKeys: string[]) => {
    try {
      const res = await fetch('/api/products/filter-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campos_activos: newKeys })
      });

      if (res.ok) {
        setActiveFilterKeys(newKeys);
        setFilters(prev => {
          const clean: Record<string, string> = { brand: prev.brand || 'all' };
          newKeys.forEach(k => { clean[k] = prev[k] || 'all'; });
          return clean;
        });
      }
    } catch (error) {
      console.error("Error saving filter config:", error);
    }
  };
  if (searchTimeoutRef.current) {
    clearTimeout(searchTimeoutRef.current);
  }

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
        title: query
      });
    }, 800);
  };

  const handleClearFilters = useCallback(() => {
    const defaultFilters: Record<string, string> = {};
    activeFilterKeys.forEach(k => defaultFilters[k] = 'all');

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
      title: ""
    });
  }, [fetchProducts, ITEMS_PER_PAGE, activeFilterKeys]);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      fetchProducts({
        page,
        limit: ITEMS_PER_PAGE,
        ...filters,
        title: searchQuery
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
        globalProcessedSlugRef.current = null;
        return;
      }
      let slug = path.replace(/^\//, "");
      if (slug.startsWith("producto/")) {
        slug = slug.substring(9);
      }

      if (!slug || slug === "blog" || slug.startsWith("blog/") || slug === "producto") {
        globalProcessedSlugRef.current = null;
        return;
      }
      if (globalProcessedSlugRef.current === slug) return;
      globalProcessedSlugRef.current = slug;
      const foundInList = garments.find(g => slugify(g.title) === slug);
      if (foundInList) {
        handleSelectGarmentWrapper(foundInList, true);
        return;
      }

      // Si no estÃ¡ en la lista inicial, buscarlo especificamente en la API
      try {
        const res = await fetch(`/api/products?q=${slug}&limit=1`);
        if (res.ok) {
          const data = await res.json();
          console.log("Respuesta de búsqueda por slug", data);
          const products = data.products || [];
          // Buscar coincidencia exacta por slug calculado
          const product = products.find((p: Garment) => slugify(p.title) === slug);
          if (product) {
            handleSelectGarmentWrapper(product, true);
            return;
          }
        }
      } catch (e) {
        console.error("[HomeClient] Error opening from deep link API fallback:", e);
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

  useEffect(() => {
    // Fetch FAQs on mount to ensure we get the latest based on the domain
    const getFaqs = async () => {
      await fetchFaqs(true, true, { limit: FAQ_LIMIT, estado: "activa", order: "asc" });
    }
    getFaqs();
  }, [authenticated, fetchFaqs, FAQ_LIMIT]);

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

  const handleUploadBannersModal = async (items: BannerUploadItem[]) => {
    //setIsLoading(true);
    try {
      for (const item of items) {
        if (item.file) {
          await uploadBanner(item.file, item.title);
        }
      }
    } catch (err: any) {
      alert("Error subiendo banners: " + err.message);
    } finally {
      //setIsLoading(false);
      setIsBannerUploadModalOpen(false);
    }
  };

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
    } catch (error: any) {
      console.error("Error al eliminar producto:", error);
      if (error?.status === 401 || (error instanceof Error && error.message.includes('401'))) {
        setAccessCodeError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo para continuar.");
        setIsAccessCodeModalOpen(true);
      }
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
        const fetchedProducts = Array.isArray(data) ? data : data.products || [];
        console.log("[useProducts] Fetched successfully:", fetchedProducts.length, "products");
        productsToExport = fetchedProducts;
      }

      if (productsToExport.length === 0) {
        alert("No hay productos para exportar.");
        return;
      }
      // 1. Encontrar todos los atributos dinámicos únicos en los productos a exportar
      // Excluimos explícitamente campos internos que no queremos en el Excel
      const internalKeys = [
        "id", "domain", "organization_id", "categoria_id", "subcategoria", "tags",
        "precio_original", "precio_descuento", "porcentaje_descuento",
        "cantidad_minima", "ubicacion", "costo", "margen_ganancia",
        "meta_title", "meta_description", "keywords", "destacado", "nuevo",
        "codigo_barras", "garantia", "qr", "sticker", "created_by", "estado",
        "disponible", "sku", "created_at", "updated_at",
        "categoria", "Categoria", "slug"
      ];

      const standardKeys = ["title", "brand", "price", "cantidad", "description", "videoUrl", "imagen_principal", "atributos_dinamicos"];

      const dynamicKeysSet = new Set<string>();
      productsToExport.forEach(p => {
        Object.keys(p).forEach(k => {
          if (!standardKeys.includes(k) && !internalKeys.includes(k) && (p as any)[k] !== undefined && (p as any)[k] !== null) {
            dynamicKeysSet.add(k);
          }
        });
      });
      const dynamicKeys = Array.from(dynamicKeysSet);

      // 2. Definir Cabeceras
      const headers = [
        "Producto",
        "Marca",
        "Precio",
        "Stock",
        "Descripción",
        "URL Video",
        "URL Imagen",
        "Atributos Dinámicos",
        "Link",
        ...dynamicKeys.map(k => k.charAt(0).toUpperCase() + k.slice(1))
      ];

      // 3. Generar Filas
      const clean = (text: any) =>
        text !== undefined && text !== null ? `"${String(text).replace(/"/g, '""').replace(/\n/g, ' ')}"` : '""';

      const rows = productsToExport.map(p => {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const productLink = `${baseUrl}/producto/${p.slug || slugify(p.title)}`;

        const baseRow = [
          clean(p.title),
          clean(p.brand),
          p.price || 0,
          p.cantidad || 0,
          clean(p.description),
          clean(p.videoUrl),
          clean(p.imagen_principal),
          clean(JSON.stringify(p.atributos_dinamicos || {})),
          clean(productLink)
        ];

        // Añadir valores dinámicos
        const dynamicValues = dynamicKeys.map(k => clean((p as any)[k]));
        return [...baseRow, ...dynamicValues];
      });

      // 4. Construir CSV
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
    } catch (error: any) {
      console.error("Error al eliminar el artículo:", error);
      if (error?.status === 401 || (error instanceof Error && error.message.includes('401'))) {
        setAccessCodeError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo para continuar.");
        setIsAccessCodeModalOpen(true);
      } else {
        alert("Error al eliminar el artículo");
      }
    } finally {
      setIsDeleting(false);
      setPostToDelete(null);
    }
  };

  const bannerSlides = useMemo(() => {
    return banners.map((banner) => ({
      id: banner.id,
      imageUrl: banner.image_url,
      title: banner.title,
      // subtitle: "Meta: " + banner.title,
    }));
  }, [banners]);

  const handleBlogPageChange = (page: number) => {
    fetchPosts({ page });
  };

  const handleReorderFaqs = useCallback(
    async (newOrder: FaqItem[]) => {
      try {
        const itemsToUpdate = newOrder.filter((item) => {
          const original = allFaqs.find((f: FaqItem) => f.id === item.id);
          return original && original.orden !== item.orden;
        });

        if (itemsToUpdate.length > 0) {
          // Actualizar secuencialmente para evitar conflictos de orden en el backend
          for (const item of itemsToUpdate) {
            await fetch('/api/faqs', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: item.id, orden: item.orden }),
            });
          }

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
    <div className="bg-[color-mix(in_srgb,var(--color-four),transparent_50%)] dark:bg-[#000000] min-h-screen font-sans text-color-three dark:text-white transition-colors">
      <Header
        isAdmin={authenticated}
        onToggleAdmin={handleToggleAdmin}
        navigate={(path) => window.location.href = path}
        isFilterVisible={isFilterVisible}
        onToggleFilters={() => setIsFilterVisible(!isFilterVisible)}
        activeFilterKeys={activeFilterKeys}
        filterOptions={filterOptions}
        filters={filters}
        onFilterChange={onFilterChange}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onAuthError={async (msg) => {
          console.log("⚠️ Intento de acción no autorizada (401). Intentando refrescar token...");
          const success = await refreshToken();
          if (!success) {
            setAccessCodeError(msg);
            setIsAccessCodeModalOpen(true);
          } else {
            console.log("✅ Token refrescado. La acción debería reintentarse o el estado actualizarse.");
          }
        }}
      />
      <main className="mx-[12px] md:mx-[23px] md:mx-auto md:max-w-[1290px] bg-color-four dark:bg-[#0F0F0F] rounded-[21px] my-5 px-[26px] py-[30px]">
        {SHOW_CAROUSEL && (
          <div className="mb-5 relative">
            {authenticated && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setIsBannerUploadModalOpen(true)}
                  className="flex items-center gap-2 bg-color-one text-color-four px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all shadow-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                  Agregar Banners
                </button>
              </div>
            )}
            <ImageCarousel
              slides={bannerSlides}
              autoPlayInterval={5000}
              isAdmin={authenticated}
              onEdit={(slide) => {
                const b = banners.find((x) => x.id === slide.id);
                if (b) setEditingBanner(b);
              }}
              onDelete={(slide) => {
                const b = banners.find((x) => x.id === slide.id);
                if (b) setDeletingBanner(b);
              }}
            />
          </div>
        )}

        {/* Modal de Eliminar Banner */}
        {deletingBanner && (
          <ConfirmationModal
            isOpen={true}
            onClose={() => setDeletingBanner(null)}
            onConfirm={async () => {
              try {
                await deleteBanner(deletingBanner.id);
                setDeletingBanner(null);
              } catch (err: any) {
                alert("Error eliminando: " + err.message);
              }
            }}
            title="Eliminar Imagen del Banner"
            message={`¿Estás seguro de que deseas eliminar la imagen "${deletingBanner.title}"? Esta acción no se puede deshacer.`}
            confirmText="Eliminar"
            cancelText="Cancelar"
          />
        )}

        {/* Modal de Editar Banner Mejorado */}
        <BannerEditModal
          isOpen={!!editingBanner}
          banner={editingBanner}
          onClose={() => setEditingBanner(null)}
          onSave={async (id, updates, file) => {
            await updateBanner(id, updates, file);
          }}
        />

        <BannerUploadModal
          isOpen={isBannerUploadModalOpen}
          onClose={() => setIsBannerUploadModalOpen(false)}
          onUpload={handleUploadBannersModal}
        />

        {isLoading && garments.length === 0 && (
          <p className="text-center text-lg text-stone-500 dark:text-[#a0a0a0] py-16">
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
                activeFilterKeys={activeFilterKeys}
                filterOptions={filterOptions}
                filters={filters}
                onFilterChange={onFilterChange}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                isFilterVisible={isFilterVisible}
                onToggleFilters={() => setIsFilterVisible(!isFilterVisible)}
                onClearFilters={handleClearFilters}
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
                      title: searchQuery
                    });
                  }
                }}
                totalProducts={totalProducts}
                isAdmin={authenticated}
                onOpenConfig={() => setIsFilterConfigModalOpen(true)}
                isLoading={isLoading}
              />

              {filteredGarments.length > 0 ? (
                <div className={`grid transition-all duration-300 gap-4 md:gap-6 lg:gap-8
                  ${gridColumns === 2 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2" :
                    gridColumns === 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3" :
                      gridColumns === 4 ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4" :
                        "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
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
              ) : isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <SpinnerIcon className="w-10 h-10 text-stone-400 animate-spin" />
                  <p className="text-stone-500 animate-pulse">Cargando productos...</p>
                </div>
              ) : (
                <p className="text-center text-lg text-stone-500 dark:text-[#a0a0a0] py-16">
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
                  onManageCategories={() => setIsCategoryModalOpen(true)}
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
              {(allFaqs.length > 0 || authenticated) && (
                <section id="faq" className="mt-24 mb-[100px] max-w-4xl mx-auto">
                  <header className="flex flex-col items-center text-center mb-12 gap-[24px]">
                    <h2 className="font-h1">
                      Preguntas Frecuentes
                    </h2>
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
                        className="inline-flex mt-8 items-center gap-2 bg-color-one text-color-four font-semibold py-2.5 px-5 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all duration-200 text-sm shadow-md hover:shadow-lg cursor-pointer"
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>Agregar pregunta</span>
                      </button>
                    )}
                  </header>

                  {allFaqs.length > 0 ? (
                    <FaqAccordion
                      items={allFaqs}
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
                  ) : (
                    authenticated && (
                      <div className="text-center py-12 border-2 border-dashed border-stone-200 dark:border-[#2a2a2a] rounded-2xl">
                        <p className="text-stone-500 dark:text-[#a0a0a0]">Aún no has agregado ninguna pregunta frecuente.</p>
                      </div>
                    )
                  )}
                </section>
              )}
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
        onAuthError={async (msg) => {
          const success = await refreshToken();
          if (!success) {
            setAccessCodeError(msg);
            setIsAccessCodeModalOpen(true);
          }
        }}
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

            // Helper function para generar un slug local sin ID
            const localSlugify = (text: string) => {
              return text
                .toString()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]+/g, '')
                .replace(/--+/g, '-');
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
                  const currentSlug = p.slug || localSlugify(p.title);
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
        onAuthError={async (msg) => {
          const success = await refreshToken();
          if (!success) {
            setAccessCodeError(msg);
            setIsAccessCodeModalOpen(true);
          }
        }}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
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
        onAuthError={async (msg) => {
          const success = await refreshToken();
          if (!success) {
            setAccessCodeError(msg);
            setIsAccessCodeModalOpen(true);
          }
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
      <SiteFooter seoTitle={seoTitle} />
      {isFilterConfigModalOpen && (
        <FilterConfigModal
          isOpen={isFilterConfigModalOpen}
          onClose={() => setIsFilterConfigModalOpen(false)}
          availableAttributes={availableAttributes}
          activeKeys={activeFilterKeys}
          onSave={handleSaveFilterConfig}
        />
      )}
    </div>
  );
}
