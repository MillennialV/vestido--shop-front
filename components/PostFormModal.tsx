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
    seo_keywords: "",
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

  // Cargar Categorías
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

  // Inicializar datos del formulario
  useEffect(() => {
    if (post) {
      let initialCategoryId = post.categories && post.categories.length > 0 ? post.categories[0].id : 0;
      if (initialCategoryId === 0 && categories.length > 0) {
        initialCategoryId = categories[0].id;
      }

      setFormData({
        title: post.title,
        slug: post.slug,
        content: post.content,
        featured_image_url: post.featured_image_url || "",
        reading_time: post.reading_time ? String(post.reading_time) : "",
        seo_description: post.seo_description || "",
        seo_keywords: post.seo_keywords || "",
        is_published: post.is_published,
        categoryId: initialCategoryId,
      });
    }
  }, [post, categories]);

  // Categoría por defecto para posts nuevos
  useEffect(() => {
    if (!post && categories.length > 0 && formData.categoryId === 0) {
      setFormData((prev) => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, post, formData.categoryId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (submitError) setSubmitError(null);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    setFormData((prev) => ({
      ...prev,
      title,
      slug: post ? prev.slug : slug,
    }));
    if (errors.title) setErrors((prev) => ({ ...prev, title: "" }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, featured_image_url: previewUrl }));
      if (errors.featured_image_url) setErrors((prev) => ({ ...prev, featured_image_url: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setSubmitError(null);

    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = "El título es obligatorio.";
    if (!formData.slug.trim()) newErrors.slug = "El slug es obligatorio.";
    if (!formData.categoryId || Number(formData.categoryId) <= 0) newErrors.categoryId = "Selecciona una categoría.";
    if (formData.content.replace(/<[^>]*>/g, "").length < 50) newErrors.content = "El contenido debe tener al menos 50 caracteres.";
    if (!imageFile && !formData.featured_image_url.trim()) newErrors.featured_image_url = "La imagen es obligatoria.";
    if (!formData.reading_time || Number(formData.reading_time) <= 0) newErrors.reading_time = "Tiempo de lectura inválido.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    let finalImageUrl = formData.featured_image_url;

    if (imageFile) {
      try {
        finalImageUrl = await azureStorageService.uploadImage(imageFile);
      } catch (err) {
        setSubmitError("Error al subir la imagen a Azure.");
        setIsSubmitting(false);
        return;
      }
    }

    const postData = {
      title: formData.title,
      slug: formData.slug,
      content: formData.content,
      featured_image_url: finalImageUrl,
      reading_time: parseInt(formData.reading_time),
      seo_description: formData.seo_description,
      seo_keywords: formData.seo_keywords,
      is_published: formData.is_published,
      category_ids: [Number(formData.categoryId)],
    };

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
        const selectedCategory = categories.find((c) => c.id === Number(formData.categoryId));
        if (selectedCategory) (result as any).categories = [selectedCategory];
        onSave(result);
        onClose();
      }
    } catch (error: any) {
      setSubmitError(error.message || "Error al guardar el artículo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="relative bg-stone-50 dark:bg-stone-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-8">
          <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
            <CloseIcon className="w-6 h-6" />
          </button>
          
          <h2 className="text-3xl font-semibold text-stone-900 dark:text-stone-100 mb-6">
            {post ? "Editar Artículo" : "Nuevo Artículo"}
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
                  className={`w-full p-2 border ${errors.title ? "border-red-500" : "border-stone-300 dark:border-stone-600"} rounded-md bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100`}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Slug (URL) *</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className={`w-full p-2 border ${errors.slug ? "border-red-500" : "border-stone-300 dark:border-stone-600"} rounded-md bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-mono text-sm`}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Categoría *</label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                >
                  <option value="0">Selecciona una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Imagen Destacada *</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="URL de imagen..."
                    value={formData.featured_image_url}
                    onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                    className="flex-grow p-2 border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-700"
                  />
                  {errors.featured_image_url && <p className="text-red-500 text-xs mt-1">{errors.featured_image_url}</p>}

                  <label className="p-2 bg-stone-200 dark:bg-stone-600 rounded-md cursor-pointer hover:bg-stone-300">
                    <UploadIcon className="w-5 h-5" />
                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                  </label>
                </div>
                {formData.featured_image_url && (
                  <img src={formData.featured_image_url} alt="Preview" className="w-full h-40 object-cover rounded-md border border-stone-200" />
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Contenido *</label>
                <div className="bg-white dark:bg-stone-700 rounded-md min-h-[300px]">
                  <ReactQuill theme="snow" value={formData.content} onChange={(val) => setFormData(p => ({...p, content: val}))} modules={modules} formats={formats} className="h-64 mb-12" />
                </div>
                {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Lectura (min)</label>
                <input type="number" name="reading_time" value={formData.reading_time} onChange={handleChange} className="w-full p-2 border border-stone-300 rounded-md dark:bg-stone-700" />
                {errors.reading_time && <p className="text-red-500 text-xs mt-1">{errors.reading_time}</p>}
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 text-sm cursor-pointer mt-5">
                  <input type="checkbox" name="is_published" checked={formData.is_published} onChange={handleCheckboxChange} className="w-4 h-4" />
                  <span className="text-stone-600 dark:text-stone-300">Publicar artículo</span>
                </label>
              </div>
            </div>

            {submitError && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{submitError}</div>}

            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-6 py-2 border border-stone-300 rounded-md hover:bg-stone-100 dark:hover:bg-stone-700">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-md hover:opacity-90 flex items-center gap-2">
                {isSubmitting && <SpinnerIcon className="w-4 h-4 animate-spin" />}
                {post ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostFormModal;