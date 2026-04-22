"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import type { Post } from "@/types/post";
import { useCategories } from "@/hooks/useCategories";
import { CloseIcon, SpinnerIcon, UploadIcon } from "@/components/ui/Icons";
import { convertToWebP } from "@/lib/imageUtils";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <textarea className="w-full h-32 p-2 border rounded" />,
});

interface PostFormModalProps {
  isOpen: boolean;
  post?: Post | null;
  onClose: () => void;
  onSubmit: (id: number, post: unknown) => Promise<void> | void;
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

const PostFormModal: React.FC<PostFormModalProps> = ({ isOpen, post, onClose, onSubmit }) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    featured_image_url: "",
    reading_time: "",
    seo_description: "",
    is_published: false,
    categoryId: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { categories, fetchCategories } = useCategories();
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (post) {
      // Modo Edición: Cargar datos del post
      setFormData({
        title: post.title || "",
        content: post.content || "",
        featured_image_url: post.featured_image_url || "",
        reading_time: post.reading_time ? String(post.reading_time) : "",
        seo_description: post.seo_description || "",
        is_published: post.is_published || false,
        categoryId: post.categories?.[0]?.id || (categories.length > 0 ? categories[0].id : 0),
      });
      setImageFile(null);
    } else if (isOpen) {
      // Modo Creación: Limpiar formulario
      setFormData({
        title: "",
        content: "",
        featured_image_url: "",
        reading_time: "",
        seo_description: "",
        is_published: false,
        categoryId: categories.length > 0 ? categories[0].id : 0,
      });
      setImageFile(null);
      setErrors({});
      setSubmitError(null);
    }
  }, [post, categories, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({ ...prev, title }));
    if (errors.title) setErrors(prev => ({ ...prev, title: "" }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const optimized = await convertToWebP(file, 0.8);
        setImageFile(optimized);
      } catch (err) {
        console.error("Error optimizando imagen de blog:", err);
        setImageFile(file);
      }
      if (errors.featured_image_url) setErrors(prev => ({ ...prev, featured_image_url: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Validaciones
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = "El título es obligatorio";
    } else if (formData.title.trim().length < 5) {
      newErrors.title = "El título debe tener al menos 5 caracteres";
    }
    if (!formData.categoryId) newErrors.categoryId = "Selecciona categoría";
    if (formData.content.length < 50) newErrors.content = "Contenido muy corto";
    if (parseInt(formData.reading_time) < 1) newErrors.reading_time = "Mínimo 1 minuto de lectura";
    if (!imageFile && !formData.featured_image_url) newErrors.featured_image_url = "Imagen obligatoria";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('reading_time', String(parseInt(formData.reading_time) || 1));
      if (formData.seo_description) {
        formDataToSend.append('seo_description', formData.seo_description);
      }
      formDataToSend.append('is_published', formData.is_published ? 'true' : 'false');
      formDataToSend.append('category_ids', String(formData.categoryId));

      if (imageFile) {
        formDataToSend.append('featured_image', imageFile);
      } else if (formData.featured_image_url) {
        formDataToSend.append('featured_image_url', formData.featured_image_url);
      }

      await onSubmit(post?.id || 0, formDataToSend);
    } catch (err: any) {
      console.error("Error capturado:", err.message);
      setSubmitError(err.message || "Error al guardar");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isRendered) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div
        className={`relative bg-stone-50 dark:bg-[#1a1a1a] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-500 hover:text-red-500 z-10"
          aria-label="Cerrar modal de artículo"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <h2 className="text-2xl font-bold dark:text-white">{post ? "Editar Artículo" : "Nuevo Artículo"}</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-[#a0a0a0]">Título *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleTitleChange}
                className="w-full p-2 border border-stone-300 dark:border-[#2a2a2a] rounded dark:bg-[#0f0f0f] dark:text-white outline-none focus:ring-1 focus:ring-stone-500 dark:focus:ring-white"
              />
              {errors.title && <span className="text-red-500 text-xs">{errors.title}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-[#a0a0a0]">Categoría *</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full p-2 border border-stone-300 dark:border-[#2a2a2a] rounded dark:bg-[#0f0f0f] dark:text-white outline-none focus:ring-1 focus:ring-stone-500 dark:focus:ring-white"
                >
                  {categories.map(c => <option key={c.id} value={c.id} className="dark:bg-[#1a1a1a]">{c.name}</option>)}
                </select>
                {errors.categoryId && <span className="text-red-500 text-xs">{errors.categoryId}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-[#a0a0a0]">Lectura (min)</label>
                <input
                  type="number"
                  min="1"
                  name="reading_time"
                  value={formData.reading_time}
                  onChange={handleChange}
                  className="w-full p-2 border border-stone-300 dark:border-[#2a2a2a] rounded dark:bg-[#0f0f0f] dark:text-white outline-none focus:ring-1 focus:ring-stone-500 dark:focus:ring-white"
                />
                {errors.reading_time && <span className="text-red-500 text-xs">{errors.reading_time}</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-[#a0a0a0]">Imagen Destacada *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="featured_image_url"
                  value={imageFile ? imageFile.name : formData.featured_image_url}
                  disabled={!!imageFile}
                  onChange={handleChange}
                  className="flex-grow p-2 border border-stone-300 dark:border-[#2a2a2a] rounded dark:bg-[#0f0f0f] dark:text-white outline-none focus:ring-1 focus:ring-stone-500 dark:focus:ring-white"
                  placeholder="URL o sube un archivo"
                />
                <label className="p-2 bg-stone-200 dark:bg-[#0f0f0f] border border-transparent dark:border-[#2a2a2a] rounded cursor-pointer hover:bg-stone-300 dark:hover:bg-[#2a2a2a] transition-colors">
                  <UploadIcon className="w-5 h-5 dark:text-white" />
                  <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
              {errors.featured_image_url && <span className="text-red-500 text-xs">{errors.featured_image_url}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-[#a0a0a0]">Contenido</label>
              <div className="bg-white dark:bg-[#0f0f0f] border border-stone-200 dark:border-[#2a2a2a] rounded overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={(val) => setFormData(f => ({ ...f, content: val }))}
                  modules={modules}
                  className="h-64 mb-12 dark:text-white"
                />
              </div>
              {errors.content && <span className="text-red-500 text-xs">{errors.content}</span>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-[#a0a0a0]">Descripción SEO</label>
              <textarea
                name="seo_description"
                value={formData.seo_description}
                onChange={handleChange}
                className="w-full p-2 border border-stone-300 dark:border-[#2a2a2a] rounded dark:bg-[#0f0f0f] dark:text-white outline-none focus:ring-1 focus:ring-stone-500 dark:focus:ring-white"
                rows={2}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={(e) => setFormData(f => ({ ...f, is_published: e.target.checked }))}
                className="w-4 h-4 rounded border-stone-300 dark:border-[#2a2a2a] dark:bg-[#0f0f0f] checked:bg-stone-800 dark:checked:bg-white"
              />
              <span className="text-sm dark:text-[#a0a0a0] group-hover:text-stone-900 dark:group-hover:text-white transition-colors">Publicar artículo</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-stone-600 dark:text-[#a0a0a0] hover:bg-stone-100 dark:hover:bg-[#2a2a2a] rounded transition-colors">Cancelar</button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-stone-800 dark:bg-white text-white dark:text-[#0f0f0f] rounded hover:bg-black dark:hover:bg-stone-200 disabled:opacity-50 transition-all shadow-md flex items-center gap-2 font-medium"
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