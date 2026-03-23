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
    logo_url?: string;
    brand_prompt?: string;
    created_at?: string;
    updated_at?: string;
}
export interface StoreMetadata {
    id?: string;
    organization_id: string;
    keywords?: string;
    google_site_verification?: string;
    metadata_base?: string;
    og_image_default?: string;
    twitter_site?: string;
    twitter_creator?: string;
    json_ld_logo?: string;
    json_ld_price_range?: string;
    address_locality?: string;
    address_region?: string;
    postal_code?: string;
    address_country?: string;
    created_at?: string;
    updated_at?: string;
}

