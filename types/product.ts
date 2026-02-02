import { Pagination } from "./pagination";

export interface Product {
  id: string;
  brand: string;
  title: string;
  size: 'xs' | 's' | 'm' | 'l' | 'xl' | string;
  color: string;
  description: string;
  videoUrl: string;
  imagen_principal: string | null;
  imagenes: string[];
  price: string;
  slug: string | null;
  material: string;
  occasion: string;
  style_notes: string;
  cantidad: number;
  disponible: boolean;
  sku: string | null;
  estado: 'activo' | 'inactivo' | string;
  categoria: string | null;
  subcategoria: string | null;
  tags: string[] | null;
  precio_original: string | number | null;
  precio_descuento: string | number | null;
  porcentaje_descuento: number | null;
  cantidad_minima: number | null;
  ubicacion: string | null;
  costo: string | number | null;
  margen_ganancia: number | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string | null;
  destacado: boolean;
  nuevo: boolean;
  codigo_barras: string | null;
  peso: string | number | null;
  dimensiones: string | null;
  cuidados: string | null;
  garantia: string | null;
  qr: string | null;
  sticker: string | null;
  created_at: string;
  updated_at: string;
}

export interface  ProductsResponse {
  products?: Product[];
  pagination?: Pagination;
}
