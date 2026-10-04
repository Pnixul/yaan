"use client";

import { useI18n } from "@/components/i18n";

import {
  Coffee,
  TrainFront,
  ShoppingBag,
  Cross,
  GraduationCap,
  Trees,
  Landmark,
  Compass,
  Building2,
  House,
  type LucideIcon,
} from "lucide-react";
import { CATEGORIES, type Category, type MockPlace } from "@/lib/mock-places";

export const categoryIcons: Record<
  Category | MockPlace["category"],
  LucideIcon
> = {
  essentials: Compass,
  food: Coffee,
  transport: TrainFront,
  shopping: ShoppingBag,
  health: Cross,
  education: GraduationCap,
  parks: Trees,
  attractions: Landmark,
  office: Building2,
  home: House,
};

export function CategoryControls({
  selected,
  onChange,
}: {
  selected: Category;
  onChange: (category: Category) => void;
}) {
  const { t } = useI18n();
  return (
    <div
      className="category-controls"
      role="group"
      aria-label={t("Nearby place category")}
    >
      {CATEGORIES.map((category) => {
        const Icon = categoryIcons[category.id];
        return (
          <button
            key={category.id}
            aria-pressed={selected === category.id}
            onClick={() => onChange(category.id)}
          >
            <Icon size={15} aria-hidden="true" />
            {t(category.label)}
          </button>
        );
      })}
    </div>
  );
}
