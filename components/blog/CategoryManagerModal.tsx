"use client";

import React, { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useCategories";
import { CloseIcon, SpinnerIcon, PlusIcon, DeleteIcon, EditIcon } from "@/components/ui/Icons";
import ConfirmationModal from "@/components/modals/ConfirmationModal";

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose }) => {
  const { categories, fetchCategories, createCategory, updateCategory, deleteCategory, clearError, isLoading, error } = useCategories();
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: number | string, name: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      // Resetear estado del formulario al abrir
      setShowCreateForm(false);
      setNewCategoryName("");
      setEditingId(null);
      setEditingName("");
      setCategoryToDelete(null);
      clearError?.();
      
      fetchCategories();
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fetchCategories, clearError]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const success = await createCategory(newCategoryName);
    if (success) {
      setNewCategoryName("");
      setShowCreateForm(false);
    }
  };

  const handleUpdate = async (id: number | string) => {
    if (!editingName.trim()) return;
    const success = await updateCategory(id, editingName);
    if (success) setEditingId(null);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      await deleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    }
  };

  if (!isRendered) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div
        className={`relative bg-white dark:bg-[#0a0a0a] text-stone-900 dark:text-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl border border-stone-200 dark:border-[#1a1a1a] transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-8 pt-8 pb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-tight">Gestionar Categorías</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors">
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-grow overflow-y-auto px-8 py-4 custom-scrollbar">
          <div className="space-y-3">
            {isLoading && categories.length === 0 ? (
              <div className="flex justify-center py-8">
                <SpinnerIcon className="w-8 h-8 animate-spin text-stone-400 dark:text-stone-600" />
              </div>
            ) : categories.length > 0 ? (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="group relative flex items-center justify-between p-4 bg-stone-50 dark:bg-black rounded-xl border border-stone-100 dark:border-[#1a1a1a] hover:border-stone-300 dark:hover:border-[#262626] transition-all"
                >
                  {editingId === category.id ? (
                    <div className="flex flex-grow gap-2 items-center">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-grow bg-white dark:bg-[#141414] border border-stone-300 dark:border-[#262626] rounded-lg p-2 text-sm focus:outline-none text-stone-900 dark:text-white"
                        autoFocus
                      />
                      <button
                        onClick={() => handleUpdate(category.id)}
                        className="bg-stone-900 dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-[13px] font-bold tracking-[0.05em] text-stone-800 dark:text-stone-100">
                        {category.name}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(category.id);
                            setEditingName(category.name);
                          }}
                          className="p-2 bg-white dark:bg-[#141414] rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-transparent transition-all shadow-sm"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCategoryToDelete({ id: category.id, name: category.name })}
                          className="p-2 text-stone-400 hover:text-red-500 transition-all"
                        >
                          <DeleteIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-stone-500 dark:text-stone-600 text-sm py-8 font-medium">No hay categorías configuradas.</p>
            )}

            {showCreateForm ? (
              <form onSubmit={handleCreate} className="animate-in fade-in slide-in-from-top-2 duration-300 pt-2">
                <div className="p-4 bg-stone-50 dark:bg-black rounded-xl border border-stone-200 dark:border-stone-800 flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Escribe una categoría..."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full bg-white dark:bg-[#141414] border border-stone-300 dark:border-[#262626] rounded-lg p-3 text-sm focus:outline-none text-stone-900 dark:text-white"
                    autoFocus
                    disabled={isLoading}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="text-stone-500 hover:text-stone-900 dark:hover:text-white text-xs px-3 py-2 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !newCategoryName.trim()}
                      className="bg-stone-900 dark:bg-white text-white dark:text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-stone-800 dark:hover:bg-stone-200 disabled:opacity-50 transition-colors shadow-md"
                    >
                      {isLoading ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full py-4 rounded-xl border border-dashed border-stone-200 dark:border-[#1a1a1a] text-stone-500 dark:text-stone-600 hover:text-stone-400 hover:border-stone-400 dark:hover:border-[#262626] transition-all flex items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-widest"
              >
                <PlusIcon className="w-4 h-4" />
                Nueva Categoría
              </button>
            )}
          </div>

          {error && <p className="text-red-500 dark:text-red-400 text-xs text-center mt-4 bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-200 dark:border-red-900/20">{error}</p>}
        </div>

        <footer className="p-8 pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-white dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#1a1a1a] text-stone-900 dark:text-white text-[13px] font-bold rounded-xl hover:bg-stone-50 dark:hover:bg-[#141414] transition-all tracking-wide shadow-sm"
          >
            Cerrar
          </button>
        </footer>

        <ConfirmationModal
          isOpen={!!categoryToDelete}
          onClose={() => setCategoryToDelete(null)}
          onConfirm={confirmDelete}
          title="Eliminar Categoría"
          message={`¿Estás seguro de que quieres eliminar la categoría "${categoryToDelete?.name}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          isProcessing={isLoading}
          variant="danger"
        />

        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.1);
            border-radius: 20px;
            border: 2px solid white;
          }
          :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #262626;
            border: 2px solid #0a0a0a;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(0,0,0,0.2);
          }
          :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #333;
          }
        `}</style>
      </div>
    </div>
  );
};

export default CategoryManagerModal;
