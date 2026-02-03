import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import type { Post } from '@/types/post';
import { usePosts } from '../hooks/usePosts';
import { azureStorageService } from '../services/azureStorageService';
import { postService } from '../services/postService'; // Direct import for category fetching
import { CloseIcon, SpinnerIcon, UploadIcon } from './Icons';
import { Category } from '@/types/category';

interface PostFormModalProps {
    post?: Post | null;
    onClose: () => void;
    onSave?: (post: Post) => void;
}

const modules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link'],
        ['clean']
    ],
};

const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet',
    'link'
];

const PostFormModal: React.FC<PostFormModalProps> = ({ post, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        featured_image_url: '',
        reading_time: '',
        seo_description: '',
        seo_keywords: '',
        is_published: false,
        categoryId: 0,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({}); // Validation errors
    const [submitError, setSubmitError] = useState<string | null>(null);

    const { createPost, updatePost } = usePosts();
    const firstInputRef = useRef<HTMLInputElement>(null);

    // Load Categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await postService.getCategories();
                setCategories(data);
            } catch (error) {
                console.error("Failed to load categories", error);
            }
        };
        fetchCategories();
    }, []);

    // Initialize form data
    useEffect(() => {
        if (post) {
            // Determine initial category ID
            // 1. Try to get from post's existing categories
            // 2. Fallback to first available category from the list if post has none
            // 3. Fallback to 0
            let initialCategoryId = post.categories && post.categories.length > 0 ? post.categories[0].id : 0;

            if (initialCategoryId === 0 && categories.length > 0) {
                initialCategoryId = categories[0].id;
            }

            setFormData(prev => ({
                ...prev, // Keep current form state if user already edited something while categories were loading? No, this is reset on post change.
                title: post.title,
                content: post.content,
                featured_image_url: post.featured_image_url || '',
                reading_time: post.reading_time ? String(post.reading_time) : '',
                seo_description: post.seo_description || '',
                seo_keywords: post.seo_keywords || '',
                is_published: post.is_published,
                categoryId: initialCategoryId,
            }));
        }
        // Only focus if we just opened the modal (this effect runs on categories change too now, so be careful with focus)
        // actually we can leave focus logic separate or just keep it simple.
    }, [post, categories]); // Re-run when categories load to potentially fix the ID default

    // Set default category for NEW posts
    useEffect(() => {
        if (!post && categories.length > 0 && formData.categoryId === 0) {
            setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
        }
    }, [categories, post]);

    // Handle "Borrador" logic specifically for existing posts (if published_at exists but we want to unpublish)
    // Actually, handleSubmit handles sending the correct payload.

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | React.ChangeEvent<HTMLTextAreaElement> | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        if (submitError) setSubmitError(null);
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;

        setFormData(prev => ({
            ...prev,
            title,
        }));
        if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
    };


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            // Create local preview
            const previewUrl = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, featured_image_url: previewUrl }));
            if (errors.featured_image_url) setErrors(prev => ({ ...prev, featured_image_url: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({}); // Clear previous errors
        setSubmitError(null);

        const newErrors: Record<string, string> = {};


        // Validation for title
        if (!formData.title.trim()) {
            newErrors.title = "El título es obligatorio.";
        }

        // Validation for category
        if (!formData.categoryId || Number(formData.categoryId) <= 0) {
            newErrors.categoryId = "Por favor selecciona una categoría válida.";
        }

        // Validation for content
        if (formData.content.replace(/<[^>]*>/g, '').length < 50) {
            newErrors.content = "El contenido es muy corto. Debe tener al menos 50 caracteres de texto.";
        }

        // Validation for featured image
        if (!imageFile && !formData.featured_image_url.trim()) {
            newErrors.featured_image_url = "La imagen destacada es obligatoria.";
        }

        // Validation for reading time
        if (!formData.reading_time || Number(formData.reading_time) <= 0) {
            newErrors.reading_time = "El tiempo de lectura debe ser mayor a 0.";
        }

        // Validation for SEO description
        if (!formData.seo_description.trim()) {
            newErrors.seo_description = "La descripción SEO es obligatoria.";
        }

        // Validation for SEO keywords
        if (!formData.seo_keywords.trim()) {
            newErrors.seo_keywords = "Las palabras clave SEO son obligatorias.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsSubmitting(false);
            return;
        }



        let finalImageUrl = formData.featured_image_url;

        // Upload image logic
        if (imageFile) {
            try {
                finalImageUrl = await azureStorageService.uploadImage(imageFile);
            } catch (err) {
                console.error("Failed to upload image:", err);
                alert("Error al subir la imagen. Intente nuevamente.");
                setIsSubmitting(false);
                return;
            }
        }

        const postData: any = {
            title: formData.title,
            content: formData.content,
            featured_image_url: finalImageUrl || "",
            reading_time: formData.reading_time ? Math.max(1, parseInt(formData.reading_time)) : 1,
            seo_description: formData.seo_description || "",
            seo_keywords: formData.seo_keywords || "",
            is_published: formData.is_published,
        };

        // Only send category_ids if it's a new post or if the category has changed
        const initialCategoryId = post?.categories?.[0]?.id || 0;
        if (!post || Number(formData.categoryId) !== initialCategoryId) {
            postData.category_ids = [Number(formData.categoryId)];
        }


        try {
            let result;
            if (post?.id) {
                const oldImageUrl = post.featured_image_url;
                result = await updatePost(post.id, postData as any);

                if (result && imageFile && oldImageUrl && oldImageUrl !== finalImageUrl) {
                    await azureStorageService.deleteImage(oldImageUrl);
                }
            } else {
                result = await createPost(postData as any);
            }

            if (result && onSave) {
                // Manually attach category for optimistic UI update (backend response might lack relations)
                const selectedCategory = categories.find(c => c.id === Number(formData.categoryId));
                if (selectedCategory) {
                    (result as any).categories = [selectedCategory];
                }

                onSave(result);
                onClose();
            }
        } catch (error: any) {
            console.error('Error saving post:', error);
            setSubmitError(error.message || 'Ocurrió un error al guardar el artículo. Por favor intente nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="relative bg-stone-50 dark:bg-stone-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-modal-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8">
                    <h2 className="text-3xl font-semibold text-stone-900 dark:text-stone-100 mb-6">
                        {post ? 'Editar Artículo' : 'Nuevo Artículo'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Título *</label>
                                <input
                                    ref={firstInputRef}
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleTitleChange}
                                    required
                                    className={`w-full p-2 border ${errors.title ? 'border-red-500' : 'border-stone-300 dark:border-stone-600'} rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100`}
                                />
                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                            </div>



                            {/* Category Select */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Categoría *</label>
                                <select
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleChange}
                                    className={`w-full p-2 border ${errors.categoryId ? 'border-red-500' : 'border-stone-300 dark:border-stone-600'} rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100`}
                                >
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Imagen Destacada *</label>
                                <div className="space-y-3">
                                    <div className="flex gap-2 mb-2">
                                        <div className="relative flex-grow">
                                            {!imageFile ? (
                                                <input
                                                    type="text"
                                                    value={formData.featured_image_url}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, featured_image_url: e.target.value });
                                                        if (errors.featured_image_url) setErrors(prev => ({ ...prev, featured_image_url: '' }));
                                                    }}
                                                    className={`w-full px-3 py-2 rounded-lg border ${errors.featured_image_url ? 'border-red-500' : 'border-stone-300 dark:border-stone-600'} bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 focus:ring-2 focus:ring-stone-500 outline-none`}
                                                    placeholder="URL de imagen externa (https://...)"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-100 dark:bg-stone-700 text-stone-900 dark:text-stone-100">
                                                    <span className="truncate text-sm pr-2 text-stone-600 dark:text-stone-300">{imageFile.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setImageFile(null);
                                                            setFormData(prev => ({ ...prev, featured_image_url: post?.featured_image_url || '' }));
                                                            if (errors.featured_image_url) setErrors(prev => ({ ...prev, featured_image_url: '' }));
                                                        }}
                                                        className="text-stone-500 hover:text-red-500 p-1"
                                                        title="Quitar archivo"
                                                    >
                                                        <CloseIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}

                                            {!imageFile && (
                                                <label className="absolute right-2 top-1/2 -translate-y-1/2 p-2 cursor-pointer text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 bg-white dark:bg-stone-700 rounded-md" title="Subir imagen desde equipo">
                                                    <UploadIcon className="w-5 h-5" />
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleFileChange}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                    {errors.featured_image_url && <p className="text-red-500 text-xs mt-1">{errors.featured_image_url}</p>}

                                    {(imageFile || formData.featured_image_url) && (
                                        <div className="relative w-full h-48 bg-stone-100 dark:bg-stone-900 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700">
                                            <img
                                                src={imageFile ? URL.createObjectURL(imageFile) : formData.featured_image_url}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Contenido *</label>
                                <div className="bg-white dark:bg-stone-700 rounded-md overflow-hidden text-stone-900 dark:text-stone-100">
                                    <ReactQuill
                                        theme="snow"
                                        value={formData.content}
                                        onChange={(content) => {
                                            setFormData(prev => ({ ...prev, content }));
                                            if (errors.content) setErrors(prev => ({ ...prev, content: '' }));
                                        }}
                                        modules={modules}
                                        formats={formats}
                                        className="h-64 mb-12"
                                    />
                                </div>
                                {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Tiempo de lectura (min) *</label>
                                <input
                                    type="number"
                                    name="reading_time"
                                    value={formData.reading_time}
                                    onChange={handleChange}
                                    min="1"
                                    className={`w-full p-2 border ${errors.reading_time ? 'border-red-500' : 'border-stone-300 dark:border-stone-600'} rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100`}
                                />
                                {errors.reading_time && <p className="text-red-500 text-xs mt-1">{errors.reading_time}</p>}
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-300 mt-6 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_published"
                                        checked={formData.is_published}
                                        onChange={handleCheckboxChange}
                                        className="w-4 h-4 text-stone-800 border-stone-300 rounded focus:ring-stone-500 dark:focus:ring-stone-400"
                                    />
                                    <span>Publicar inmediatamente</span>
                                </label>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Descripción SEO *</label>
                                <textarea
                                    name="seo_description"
                                    value={formData.seo_description}
                                    onChange={handleChange}
                                    rows={2}
                                    className={`w-full p-2 border ${errors.seo_description ? 'border-red-500' : 'border-stone-300 dark:border-stone-600'} rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100`}
                                />
                                {errors.seo_description && <p className="text-red-500 text-xs mt-1">{errors.seo_description}</p>}
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Palabras Clave SEO (separadas por comas) *</label>
                                <textarea
                                    name="seo_keywords"
                                    value={formData.seo_keywords}
                                    onChange={handleChange}
                                    rows={2}
                                    className={`w-full p-2 border ${errors.seo_keywords ? 'border-red-500' : 'border-stone-300 dark:border-stone-600'} rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100`}
                                    placeholder="ej: vestidos, moda, fiesta"
                                />
                                {errors.seo_keywords && <p className="text-red-500 text-xs mt-1">{errors.seo_keywords}</p>}
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 pt-6 mt-6 border-t border-stone-200 dark:border-stone-700">
                            {submitError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800">
                                    {submitError}
                                </div>
                            )}
                            <div className="flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-stone-800 dark:bg-stone-700 text-white font-medium py-2 px-6 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSubmitting && <SpinnerIcon className="w-4 h-4 animate-spin" />}
                                    {post ? 'Actualizar' : (formData.is_published ? 'Publicar' : 'Guardar Borrador')}
                                </button>
                            </div>
                        </div>
                    </form>
                </div >

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 transition-colors bg-white dark:bg-stone-700 rounded-full p-1"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div >
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                @keyframes modal-in {
                  from { opacity: 0; transform: scale(0.95); }
                  to { opacity: 1; transform: scale(1); }
                }
                .animate-modal-in { animation: modal-in 0.3s ease-out forwards; }
                
                /* Quill dark mode overrides */
                .ql-toolbar {
                    background-color: #f5f5f4;
                    border-color: #e7e5e4 !important;
                }
                :is(.dark .ql-toolbar) {
                    background-color: #44403c;
                    border-color: #57534e !important;
                }
                :is(.dark .ql-stroke) {
                    stroke: #d6d3d1 !important;
                }
                :is(.dark .ql-fill) {
                    fill: #d6d3d1 !important;
                }
                :is(.dark .ql-picker) {
                    color: #d6d3d1 !important;
                }
                .ql-container {
                    border-color: #e7e5e4 !important;
                    font-size: 1rem;
                }
                :is(.dark .ql-container) {
                    border-color: #57534e !important;
                }
            `}</style>
        </div >
    );
};

export default PostFormModal;
