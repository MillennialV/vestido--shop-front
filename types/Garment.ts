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
    cantidad?: number;
    imagen_principal?: string;
}
