export interface BlogPagination {
    page: number;
    limit: number;
    hasNextPage: boolean;
}

export interface Post {
    id: number;
    title: string;
    slug: string;
    content: string;
    featured_image_url: string;
    is_published: boolean;
    reading_time: number;
    seo_description: string;
    categories: Category[];
    created_at: string;
    updated_at?: string;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
}

export interface PostResponse {
    posts: Post[];
    pagination: BlogPagination;
}
