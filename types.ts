
export interface Garment {
  id: number;
  brand: string;
  title: string;
  size: string;
  color: string;
  videoUrl: string;
  description: string;
  created_at: string;
  price?: number;
  slug?: string;
  material?: string;
  occasion?: string;
  style_notes?: string;
}

export interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // HTML content for the article body
  image_url: string; // URL for the article's main visual (can be a video)
  garment_id: number; // The ID of the associated garment
  created_at: string;
}
