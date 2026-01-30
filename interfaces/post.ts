export interface Post {
    id: number;
    title: string;
    slug: string;
    content: string;
    featured_image_url: string;
    reading_time: number;
    seo_description: string;
    seo_keywords: string;
    categories: Category[];
    published_at: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
}