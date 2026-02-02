import { BlobServiceClient } from '@azure/storage-blob';

// Para funcionamiento en navegador, necesitamos un SAS Token en lugar de la Shared Key.
// La SharedKeyCredential no funciona en el navegador por seguridad.
const ACCOUNT_NAME = "vestidosmillev";
const CONTAINER_NAME = "blog-images";

// IMPORTANTE: En producción, este token debe generarse en el backend.
// Por ahora, usaremos un token temporal o instrucción.
// Instrucción: Generar un SAS token desde el portal de Azure o Azure Storage Explorer
// con permisos de Write/Create para el contenedor 'blog-images'.
const SAS_TOKEN = "?sv=2026-02-06&ss=b&srt=sco&spr=https&st=2026-02-01T18%3A12%3A11Z&se=2027-02-01T18%3A12%3A11Z&sp=rwdlac&sig=2KWZnROGKUbeBuZ6qmFBPVu749YhBlD9mpujo5Et%2BME%3D";

class AzureStorageService {
    private blobServiceClient: BlobServiceClient | null = null;
    private isInitialized = false;

    constructor() {
        if (SAS_TOKEN) {
            try {
                const url = `https://${ACCOUNT_NAME}.blob.core.windows.net?${SAS_TOKEN}`;
                this.blobServiceClient = new BlobServiceClient(url);
                this.isInitialized = true;
            } catch (error) {
                console.error("Failed to initialize Azure Storage Service:", error);
            }
        } else {
            console.warn("Azure Storage: SAS Token no configurado. La subida no funcionará hasta configurar un SAS Token válido.");
        }
    }

    async uploadImage(file: File): Promise<string> {
        if (!SAS_TOKEN) {
            throw new Error("Configuración incompleta: Se requiere un SAS Token para subir archivos desde el navegador (Shared Keys no son seguras/compatibles en frontend).");
        }
        if (!this.blobServiceClient || !this.isInitialized) {
            throw new Error("Azure Storage Service no está inicializado.");
        }

        try {
            const containerClient = this.blobServiceClient.getContainerClient(CONTAINER_NAME);

            const timestamp = new Date().getTime();
            const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const blockBlobClient = containerClient.getBlockBlobClient(fileName);

            const options = {
                blobHTTPHeaders: { blobContentType: file.type }
            };

            await blockBlobClient.uploadData(file, options);

            return blockBlobClient.url.split('?')[0];
        } catch (error: any) {
            console.error("Error uploading to Azure Blob Storage:", error);
            throw new Error(`Error uploading image: ${error.message || error}`);
        }
    }

    async deleteImage(imageUrl: string): Promise<void> {
        if (!this.blobServiceClient || !this.isInitialized) return;
        if (!imageUrl || !imageUrl.includes(CONTAINER_NAME)) return;

        try {
            const urlParts = imageUrl.split(`/${CONTAINER_NAME}/`);
            if (urlParts.length !== 2) return;

            const fileName = urlParts[1];
            const containerClient = this.blobServiceClient.getContainerClient(CONTAINER_NAME);
            const blockBlobClient = containerClient.getBlockBlobClient(fileName);

            await blockBlobClient.deleteIfExists();
            console.log(`Deleted image blob: ${fileName}`);
        } catch (error) {
            console.error("Error deleting image from Azure:", error);
        }
    }
}

export const azureStorageService = new AzureStorageService();
export default azureStorageService;
