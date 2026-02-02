import type { Garment } from '@/types/Garment';
import type { Post } from '@/types/post';

const PRODUCT_SCHEMA_ID = 'product-schema';
const ARTICLE_SCHEMA_ID = 'article-schema';
const BREADCRUMB_SCHEMA_ID = 'breadcrumb-schema';

export const PUBLIC_URL = 'https://www.vestido.shop';

const DEFAULT_TITLE = 'Vestidos de Fiesta en Lima | Showroom en San Isidro';
const DEFAULT_DESCRIPTION = 'Encuentra vestidos elegantes e importados en nuestro showroom de San Isidro. Diseños exclusivos para tus eventos en Lima, Perú.';
const DEFAULT_IMAGE_URL = 'https://storage.googleapis.com/aistudio-hosting/VENICE-og-image.jpg';

const getCanonicalUrl = (path: string = ''): string => {
    return new URL(path, PUBLIC_URL).toString();
};

/**
 * Helper to update a tag's attribute. Creates the tag if it doesn't exist.
 */
const updateTag = (selector: string, attribute: string, content: string, isLink: boolean = false) => {
    let tag = document.querySelector<HTMLElement>(selector);
    if (!tag) {
        tag = document.createElement(isLink ? 'link' : 'meta');
        if (isLink) {
            (tag as HTMLLinkElement).rel = selector.match(/\[rel='(.*?)']/)![1];
        } else {
            const prop = selector.match(/\[(name|property)='(.*?)']/)!;
            tag.setAttribute(prop[1], prop[2]);
        }
        document.head.appendChild(tag);
    }
    tag.setAttribute(attribute, content);
};

/**
 * Updates the main SEO meta tags in the document's head.
 */
const setCoreMetaTags = (title: string, description: string, url: string) => {
    document.title = title;
    updateTag('meta[name="description"]', 'content', description);
    updateTag('link[rel="canonical"]', 'href', url, true);

    // Open Graph / Facebook
    updateTag('meta[property="og:title"]', 'content', title);
    updateTag('meta[property="og:description"]', 'content', description);
    updateTag('meta[property="og:url"]', 'content', url);

    // Twitter
    updateTag('meta[property="twitter:title"]', 'content', title);
    updateTag('meta[property="twitter:description"]', 'content', description);
    updateTag('meta[property="twitter:url"]', 'content', url);
};

/**
 * Removes a dynamically injected JSON-LD schema by its ID.
 */
const removeSchema = (id: string) => {
    const scriptTag = document.getElementById(id);
    if (scriptTag) {
        scriptTag.remove();
    }
};

/**
 * Injects a JSON-LD schema into the document's head.
 */
const injectSchema = (id: string, schema: object) => {
    removeSchema(id); // Ensure no duplicates
    const script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(schema, null, 2);
    document.head.appendChild(script);
};

/**
 * Injects a Breadcrumb JSON-LD schema.
 */
const injectBreadcrumbSchema = (items: { name: string; url: string }[]) => {
    const itemListElement = items.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
        'item': item.url,
    }));

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': itemListElement,
    };
    injectSchema(BREADCRUMB_SCHEMA_ID, schema);
};


/**
 * Clears all dynamic page-specific schemas.
 */
const clearPageSpecificSchemas = () => {
    removeSchema(PRODUCT_SCHEMA_ID);
    removeSchema(ARTICLE_SCHEMA_ID);
};

// --- Public SEO Functions for Different Pages ---

export const setHomePageSeo = () => {
    clearPageSpecificSchemas();
    setCoreMetaTags(DEFAULT_TITLE, DEFAULT_DESCRIPTION, getCanonicalUrl('/'));
    injectBreadcrumbSchema([{ name: 'Inicio', url: getCanonicalUrl('/') }]);
};

export const setGarmentPageSeo = (garment: Garment) => {
    clearPageSpecificSchemas();
    if (!garment.slug) {
        setHomePageSeo();
        return;
    }

    const url = getCanonicalUrl(`/#/${garment.slug}`);
    const title = `${garment.title} | ${garment.brand} - Womanity Boutique`;

    setCoreMetaTags(title, garment.description, url);

    const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        'name': garment.title,
        'description': garment.description,
        'productID': garment.id,
        'url': url,
        'image': garment.videoUrl || DEFAULT_IMAGE_URL,
        'brand': {
            '@type': 'Brand',
            'name': garment.brand,
        },
        'offers': garment.price ? {
            '@type': 'Offer',
            'priceCurrency': 'PEN',
            'price': garment.price.toFixed(2),
            'availability': 'https://schema.org/InStock',
            'url': url,
        } : undefined,
    };
    injectSchema(PRODUCT_SCHEMA_ID, productSchema);

    injectBreadcrumbSchema([
        { name: 'Inicio', url: getCanonicalUrl('/') },
        { name: garment.title, url: url }
    ]);
};

export const setBlogIndexPageSeo = () => {
    clearPageSpecificSchemas();
    const url = getCanonicalUrl('/#/blog');
    const title = 'Blog | Inspiración y Estilo - Womanity Boutique';
    const description = 'Descubre las historias detrás de nuestros diseños, consejos de moda y las últimas tendencias en el blog oficial de Womanity Boutique.';

    setCoreMetaTags(title, description, url);
    injectBreadcrumbSchema([
        { name: 'Inicio', url: getCanonicalUrl('/') },
        { name: 'Blog', url: url }
    ]);
};

export const setPostPageSeo = (post: Post) => {
    clearPageSpecificSchemas();
    if (!post.slug) {
        setBlogIndexPageSeo();
        return;
    }

    const url = getCanonicalUrl(`/#/blog/${post.slug}`);
    const title = `${post.title} | Blog - Womanity Boutique`;

    setCoreMetaTags(title, post.seo_description || post.content.substring(0, 160), url);

    const postSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': post.title,
        'description': post.seo_description || post.content.substring(0, 160),
        'image': post.featured_image_url || DEFAULT_IMAGE_URL,
        'datePublished': post.published_at,
        'author': {
            '@type': 'Organization',
            'name': 'Womanity Boutique',
            'url': getCanonicalUrl('/')
        },
        'publisher': {
            '@type': 'Organization',
            'name': 'Womanity Boutique',
            'logo': {
                '@type': 'ImageObject',
                'url': 'https://storage.googleapis.com/aistudio-hosting/VENICE-logo.png'
            }
        },
        'mainEntityOfPage': {
            '@type': 'WebPage',
            '@id': url
        }
    };
    injectSchema(ARTICLE_SCHEMA_ID, postSchema);

    injectBreadcrumbSchema([
        { name: 'Inicio', url: getCanonicalUrl('/') },
        { name: 'Blog', url: getCanonicalUrl('/#/blog') },
        { name: post.title, url: url }
    ]);
};