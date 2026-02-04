import { BlockBlobClient } from '@azure/storage-blob';
import { BLOG_BASE_API } from "@/core/apiConfig";

class AzureStorageService {
    token = localStorage.getItem('authToken');


    async uploadImage(file: File): Promise<string> {
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${new Date().getTime()}-${sanitizedFileName}`;

        const urlFetch = `${BLOG_BASE_API}/api/generate-sas-token`;
        const response = await fetch(urlFetch, {
            method: 'POST',
            body: JSON.stringify({ fileName }),
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` }
        });

        if (!response.ok) throw new Error("No se pudo obtener autorización del servidor");

        const { sasToken, url } = await response.json();

        const sasQuery = sasToken.startsWith('?') ? sasToken : `?${sasToken}`;
        const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        const blobUrl = `${cleanUrl}/${fileName}${sasQuery}`;

        const blockBlobClient = new BlockBlobClient(blobUrl);

        await blockBlobClient.uploadData(file, {
            blobHTTPHeaders: { blobContentType: file.type }
        });

        return blockBlobClient.url.split('?')[0];
    }

    async deleteImage(imageUrl: string): Promise<void> {
        if (!imageUrl) return;

        try {
            const urlFetch = `${BLOG_BASE_API}/api/delete-image`;
            const response = await fetch(urlFetch, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.token}` },
                body: JSON.stringify({ imageUrl })
            });

            if (!response.ok) {
                console.warn(`No se pudo eliminar la imagen: ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error solicitando eliminación de imagen:", error);
        }
    }
}

export const azureStorageService = new AzureStorageService();
export default azureStorageService;
