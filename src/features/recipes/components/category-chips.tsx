"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Cake, Carrot, ChefHat, Heart, Salad, Soup, Utensils, Zap } from "lucide-react";
import { useRecipes } from "@/features/recipes/context/recipe-context";

const CATEGORY_TO_FILTER: Record<string, { mealType?: string; difficulty?: string }> = {
    all: {},
    appetizers: { mealType: "snack" },
    mainCourses: { mealType: "dinner" },
    saladsSides: { mealType: "lunch" },
    vegetarian: {},
    desserts: { mealType: "dessert" },
    healthy: {},
    quickEasy: { difficulty: "easy" },
};

const CATEGORIES = [
    { key: "all", icon: Utensils },
    { key: "appetizers", icon: Soup },
    { key: "mainCourses", icon: ChefHat },
    { key: "saladsSides", icon: Salad },
    { key: "vegetarian", icon: Carrot },
    { key: "desserts", icon: Cake },
    { key: "healthy", icon: Heart },
    { key: "quickEasy", icon: Zap },
];

/** Horizontal category filter for the recipe library. */
export function CategoryChips() {
    const t = useTranslations("Hero");
    const { filters, updateFilter, clearFilters } = useRecipes();

    const activeCategory = (() => {
        if (!filters.mealType && !filters.difficulty) return "all";

        for (const [key, mapping] of Object.entries(CATEGORY_TO_FILTER)) {
            if (key === "all") continue;
            if (mapping.mealType && filters.mealType === mapping.mealType) return key;
            if (mapping.difficulty && filters.difficulty === mapping.difficulty) return key;
        }
        return null;
    })();

    const handleClick = (key: string) => {
        if (key === "all") {
            clearFilters();
            return;
        }

        const mapping = CATEGORY_TO_FILTER[key];
        if (mapping.mealType) {
            updateFilter("mealType", filters.mealType === mapping.mealType ? "" : mapping.mealType);
            updateFilter("difficulty", "");
        } else if (mapping.difficulty) {
            updateFilter(
                "difficulty",
                filters.difficulty === mapping.difficulty ? "" : mapping.difficulty
            );
            updateFilter("mealType", "");
        }
    };

    // The negative margin lets the row bleed to the screen edge as it scrolls,
    // so it has to track the shell's padding at each step. From lg there is room
    // for the chips to wrap instead of scrolling.
    return (
        <div className="scrollbar-hidden edge-fade -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:[mask-image:none]">
            {CATEGORIES.map((category) => {
                const isActive = activeCategory === category.key;

                return (
                    <motion.button
                        key={category.key}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleClick(category.key)}
                        className={`tap flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs font-medium transition-colors ${
                            isActive
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-surface-raised text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        }`}
                    >
                        <category.icon className="h-3.5 w-3.5" />
                        {t(`categories.${category.key}`)}
                    </motion.button>
                );
            })}
        </div>
    );
}
