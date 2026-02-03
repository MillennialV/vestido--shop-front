import { MetadataRoute } from "next";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: API_BASE_URL,
            lastModified: new Date().toISOString(),
        },
    ];
}
