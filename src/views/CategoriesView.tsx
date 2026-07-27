import React from "react";
import { motion } from "motion/react";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "../components/ui/Card";
import type { Category } from "../storage";

interface CategoriesViewProps {
  categories: Category[];
  setIsAddingCategory: (v: boolean) => void;
  setEditingCategory: (v: Category | null) => void;
  handleDeleteCategory: (id: string) => Promise<void>;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  setIsAddingCategory,
  setEditingCategory,
  handleDeleteCategory,
}) => {
  return (
    <motion.div
      key="categories"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 md:p-8 max-w-4xl mx-auto w-full"
    >
      <header className="flex justify-between items-center mb-8 md:mb-10">
        <h2 className="text-2xl md:text-3xl font-extrabold font-mono-nums tracking-tight" style={{ color: "var(--text-primary)" }}>
          Categories
        </h2>
        <button
          onClick={() => setIsAddingCategory(true)}
          className="flex h-10 w-10 items-center justify-center rounded-[9px] border transition-colors"
          style={{ border: "1px solid var(--surface-border-strong)", background: "var(--hover-overlay)", color: "var(--text-secondary)" }}
          aria-label="New Category"
        >
          <Plus className="w-4 h-4" />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <Card key={cat.id} className="p-6 flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{
                backgroundColor: `${cat.color}20`,
                color: cat.color,
              }}
            >
              {cat.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                {cat.name}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-xs uppercase tracking-wider font-mono" style={{ color: "var(--text-secondary)" }}>
                  {cat.color}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingCategory(cat)}
                className="rounded-lg p-2 transition-colors"
                style={{ background: "var(--hover-overlay)", color: "var(--text-secondary)" }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                className="rounded-lg bg-rose-500/10 p-2 text-rose-500 transition-colors hover:bg-rose-500/20 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
};
