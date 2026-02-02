import { Pagination } from "./pagination";
export interface Post {
    id: number;
    title: string;
    slug: string;
    content: string;
    featured_image_url: string;
    is_published: boolean;
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

export interface PostResponse {
    posts?: Post[];
    pagination?: Pagination;
}