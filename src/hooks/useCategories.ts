import React, { useState } from "react";
import { storage, type Category } from "../storage";

const uid = () => crypto.randomUUID();

export function useCategories(options: {
  onCategoriesLoaded?: (categories: Category[]) => void;
  onCategoriesChanged?: () => void | Promise<unknown>;
  confirmAction: (options: {
    title: string;
    message: string;
    confirmLabel?: string;
  }) => Promise<boolean>;
}) {
  const { onCategoriesLoaded, onCategoriesChanged, confirmAction } = options;
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    color: "#10b981",
    icon: "\uD83C\uDFAF", // 🎯 Direct Hit emoji
  });

  const fetchCategories = async () => {
    const data = await storage.getCategories();
    setCategories(data);
    onCategoriesLoaded?.(data);
    return data;
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;

    const tempId = uid();
    const optimisticCategory = { ...newCategory, id: tempId };

    setCategories((prev) => [...prev, optimisticCategory]);

    setIsAddingCategory(false);
    setNewCategory({ name: "", color: "#10b981", icon: "🎯" });

    storage
      .addCategory(optimisticCategory)
      .then(async () => {
        await fetchCategories();
      })
      .catch((err) => console.error("Failed to add category:", err));
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setCategories((prev) =>
      prev.map((c) => (c.id === editingCategory.id ? editingCategory : c)),
    );

    const idToUpdate = editingCategory.id;
    const nameToUpdate = editingCategory.name;
    const colorToUpdate = editingCategory.color;
    const iconToUpdate = editingCategory.icon;

    setEditingCategory(null);

    storage
      .updateCategory(idToUpdate, nameToUpdate, colorToUpdate, iconToUpdate)
      .then(async () => {
        await fetchCategories();
        await onCategoriesChanged?.();
      })
      .catch((err) => console.error("Failed to update category:", err));
  };

  const handleDeleteCategory = async (id: string) => {
    const shouldDelete = await confirmAction({
      title: "Delete Category?",
      message:
        "Goals using it will remain, but they will lose their category mapping.",
      confirmLabel: "Delete",
    });
    if (!shouldDelete) {
      return;
    }

    setCategories((prev) => prev.filter((c) => c.id !== id));

    storage
      .deleteCategory(id)
      .then(async () => {
        await fetchCategories();
      })
      .catch((err) => console.error("Failed to delete category:", err));
  };

  return {
    categories,
    setCategories,
    editingCategory,
    setEditingCategory,
    isAddingCategory,
    setIsAddingCategory,
    newCategory,
    setNewCategory,
    fetchCategories,
    handleAddCategory,
    handleEditCategory,
    handleDeleteCategory,
  };
}
