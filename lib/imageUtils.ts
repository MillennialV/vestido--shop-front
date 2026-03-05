
/**
 * Convierte un objeto File o Blob de imagen a formato WebP.
 * @param file El archivo original (jpg, png, etc.)
 * @param quality Calidad de la conversión (0.0 a 1.0)
 * @returns Un nuevo objeto File con formato image/webp
 */
export async function convertToWebP(file: File, quality: number = 0.8): Promise<File> {
    // Si ya es webp, no hacemos nada
    if (file.type === 'image/webp') return file;

    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('No se pudo obtener el contexto del canvas'));
                return;
            }

            ctx.drawImage(img, 0, 0);

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Error al convertir imagen a WebP'));
                    return;
                }

                // Crear un nuevo File a partir del Blob
                const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                const newFile = new File([blob], newFileName, { type: 'image/webp' });
                resolve(newFile);
            }, 'image/webp', quality);
        };

        img.onerror = (err) => {
            URL.revokeObjectURL(objectUrl);
            reject(err);
        };

        img.src = objectUrl;
    });
}
