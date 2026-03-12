export interface ThemeColors {
    id?: number;
    organization_id: number;
    color_one: string;
    color_two: string;
    color_three: string;
    color_four: string;
    created_at?: string;
    updated_at?: string;
}

export interface StoreInfo {
    id?: number;
    organization_id: number;
    title: string;
    description?: string;
    email?: string;
    address?: string;
    whatsapp?: string;
    schedule?: string;
    facebook_url?: string;
    instagram_url?: string;
    terms_url?: string;
    privacy_url?: string;
    shipping_url?: string;
    footer_license?: string;
    is_carousel_enabled?: boolean;
    created_at?: string;
    updated_at?: string;
}
