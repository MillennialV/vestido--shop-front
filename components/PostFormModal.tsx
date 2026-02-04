"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import type { Post } from "@/types/post";
import { usePosts } from "@/hooks/usePosts";
import { azureStorageService } from "@/services/azureStorageService";
import { CloseIcon, SpinnerIcon, UploadIcon } from "@/components/Icons";
import { Category } from "@/types/category";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <textarea className="w-full h-32 p-2 border rounded" />,
});

interface PostFormModalProps {
  post?: Post | null;
  onClose: () => void;
  onSave?: (post: Post) => void;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link"],
    ["clean"],
  ],
};

const formats = ["header", "bold", "italic", "underline", "strike", "blockquote", "list", "link"];

const PostFormModal: React.FC<PostFormModalProps> = ({ post, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    featured_image_url: "",
    reading_time: "",
    seo_description: "",
    is_published: false,
    categoryId: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { createPost, updatePost } = usePosts();
  const firstInputRef = useRef<HTMLInputElement>(null);

  // 1. Cargar Categorías
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/posts/categories");
        if (!res.ok) throw new Error("Error al cargar categorías");
        const data = await res.json();
        const categoriesArray = Array.isArray(data) ? data : (data.categories || []);
        setCategories(categoriesArray);
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };
    fetchCategories();
  }, []);

  // 2. Inicializar formulario cuando hay un post o cargan las categorías
  useEffect(() => {
    if (post) {
      const initialCategoryId = post.categories?.[0]?.id || (categories.length > 0 ? categories[0].id : 0);
      setFormData({
        title: post.title || "",
        slug: post.slug || "",
        content: post.content || "",
        featured_image_url: post.featured_image_url || "",
        reading_time: post.reading_time ? String(post.reading_time) : "",
        seo_description: post.seo_description || "",
        is_published: post.is_published || false,
        categoryId: initialCategoryId,
      });
    } else if (categories.length > 0 && formData.categoryId === 0) {
      setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [post, categories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    // Generar slug automático solo si es un post nuevo
    const slug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    setFormData(prev => ({ ...prev, title, slug: post ? prev.slug : slug }));
    if (errors.title) setErrors(prev => ({ ...prev, title: "" }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      if (errors.featured_image_url) setErrors(prev => ({ ...prev, featured_image_url: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    
    // Validaciones
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "Título obligatorio";
    if (!formData.categoryId) newErrors.categoryId = "Selecciona categoría";
    if (formData.content.length < 50) newErrors.content = "Contenido muy corto";
    if (!imageFile && !formData.featured_image_url) newErrors.featured_image_url = "Imagen obligatoria";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      let finalImageUrl = formData.featured_image_url;
      if (imageFile) {
        finalImageUrl = await azureStorageService.uploadImage(imageFile);
      }

      const postData = {
        ...formData,
        featured_image_url: finalImageUrl,
        reading_time: parseInt(formData.reading_time) || 1,
        category_ids: [Number(formData.categoryId)],
      };

      let result;
      if (post?.id) {
        result = await updatePost(post.id, postData as any);
      } else {
        result = await createPost(postData as any);
      }


      if (onSave && result && result.success) {
        onSave(result.data);
        onClose();
      }

    } catch (err: any) {
      console.error("Error capturado:", err.message);
      setSubmitError(err.message || "Error al guardar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-stone-50 dark:bg-stone-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-red-500 z-10">
          <CloseIcon className="w-6 h-6" />
        </button>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <h2 className="text-2xl font-bold">{post ? "Editar Artículo" : "Nuevo Artículo"}</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Título *</label>
              <input 
                type="text" 
                name="title" 
                value={formData.title} 
                onChange={handleTitleChange}
                className="w-full p-2 border rounded dark:bg-stone-700" 
              />
              {errors.title && <span className="text-red-500 text-xs">{errors.title}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Categoría *</label>
                <select 
                  name="categoryId" 
                  value={formData.categoryId} 
                  onChange={handleChange}
                  className="w-full p-2 border rounded dark:bg-stone-700"
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lectura (min)</label>
                <input 
                  type="number" 
                  name="reading_time" 
                  value={formData.reading_time} 
                  onChange={handleChange} 
                  className="w-full p-2 border rounded dark:bg-stone-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Imagen Destacada *</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  name="featured_image_url" 
                  value={imageFile ? imageFile.name : formData.featured_image_url} 
                  disabled={!!imageFile}
                  onChange={handleChange}
                  className="flex-grow p-2 border rounded dark:bg-stone-700"
                  placeholder="URL o sube un archivo"
                />
                <label className="p-2 bg-stone-200 dark:bg-stone-600 rounded cursor-pointer">
                  <UploadIcon className="w-5 h-5" />
                  <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contenido</label>
              <div className="bg-white dark:bg-stone-700 rounded overflow-hidden">
                <ReactQuill 
                  theme="snow" 
                  value={formData.content} 
                  onChange={(val) => setFormData(f => ({...f, content: val}))}
                  modules={modules}
                  className="h-64 mb-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descripción SEO</label>
              <textarea 
                name="seo_description" 
                value={formData.seo_description} 
                onChange={handleChange}
                className="w-full p-2 border rounded dark:bg-stone-700"
                rows={2}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                name="is_published" 
                checked={formData.is_published} 
                onChange={(e) => setFormData(f => ({...f, is_published: e.target.checked}))}
              />
              <span className="text-sm">Publicar artículo</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 hover:bg-stone-200 rounded">Cancelar</button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2 bg-stone-800 text-white rounded hover:bg-black disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <SpinnerIcon className="w-4 h-4 animate-spin" />}
              {post ? "Actualizar" : "Guardar"}
            </button>
          </div>
          {submitError && <p className="text-red-500 text-center text-sm">{submitError}</p>}
        </form>
      </div>
    </div>
  );
};

export default PostFormModal;