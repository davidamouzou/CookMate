"use client";

import { useRecipes, FilterState } from "@/features/recipes/context/recipe-context";
import { useTranslations } from "next-intl";
import { X, Clock, ChefHat, Utensils, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "dessert"] as const;
const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120] as const;

export function FilterBar() {
    const { filters, updateFilter, clearFilters, hasActiveFilters, availableCuisines } = useRecipes();
    const t = useTranslations("Filters");

    const handleMealTypeClick = (type: string) => {
        updateFilter("mealType", filters.mealType === type ? "" : type);
    };

    const handleDifficultyClick = (diff: string) => {
        updateFilter("difficulty", filters.difficulty === diff ? "" : diff);
    };

    const handleCuisineChange = (cuisine: string) => {
        updateFilter("cuisine", cuisine);
    };

    const handleDurationChange = (duration: number | null) => {
        updateFilter("maxDuration", filters.maxDuration === duration ? null : duration);
    };

    return (
        <div className="space-y-4">
            {/* Meal Type Pills */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Utensils className="w-4 h-4" />
                    {t("mealType")}
                </div>
                <div className="flex flex-wrap gap-2">
                    {MEAL_TYPES.map((type) => (
                        <button
                            key={type}
                            onClick={() => handleMealTypeClick(type)}
                            className={`tap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                                filters.mealType === type
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "bg-secondary/50 hover:bg-secondary text-secondary-foreground"
                            }`}
                        >
                            {t(`mealTypes.${type}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Difficulty Pills */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <ChefHat className="w-4 h-4" />
                    {t("difficulty")}
                </div>
                <div className="flex flex-wrap gap-2">
                    {DIFFICULTIES.map((diff) => (
                        <button
                            key={diff}
                            onClick={() => handleDifficultyClick(diff)}
                            className={`tap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                                filters.difficulty === diff
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "bg-secondary/50 hover:bg-secondary text-secondary-foreground"
                            }`}
                        >
                            {t(`difficulties.${diff}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Duration Pills */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {t("maxDuration")}
                </div>
                <div className="flex flex-wrap gap-2">
                    {DURATION_OPTIONS.map((duration) => (
                        <button
                            key={duration}
                            onClick={() => handleDurationChange(duration)}
                            className={`tap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                                filters.maxDuration === duration
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "bg-secondary/50 hover:bg-secondary text-secondary-foreground"
                            }`}
                        >
                            {duration < 60 ? `${duration} min` : `${duration / 60}h`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cuisine Select */}
            {availableCuisines.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Globe className="w-4 h-4" />
                        {t("cuisine")}
                    </div>
                    <select
                        value={filters.cuisine}
                        onChange={(e) => handleCuisineChange(e.target.value)}
                        className="tap rounded-full border-none bg-secondary/50 px-4 py-2 text-sm font-medium text-secondary-foreground outline-none hover:bg-secondary"
                    >
                        <option value="">{t("allCuisines")}</option>
                        {availableCuisines.map((cuisine) => (
                            <option key={cuisine} value={cuisine}>
                                {cuisine}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Active Filters & Clear */}
            <AnimatePresence>
                {hasActiveFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-2"
                    >
                        <button
                            onClick={clearFilters}
                            className="tap flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
                        >
                            <X className="w-4 h-4" />
                            {t("clearAll")}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function ActiveFilterBadges() {
    const { filters, searchQuery, updateFilter, setSearchQuery } = useRecipes();
    const t = useTranslations("Filters");

    const badges: { key: keyof FilterState | "search"; label: string; onRemove: () => void }[] = [];

    if (searchQuery) {
        badges.push({
            key: "search",
            label: `"${searchQuery}"`,
            onRemove: () => setSearchQuery(""),
        });
    }

    if (filters.mealType) {
        badges.push({
            key: "mealType",
            label: t(`mealTypes.${filters.mealType}`),
            onRemove: () => updateFilter("mealType", ""),
        });
    }

    if (filters.difficulty) {
        badges.push({
            key: "difficulty",
            label: t(`difficulties.${filters.difficulty}`),
            onRemove: () => updateFilter("difficulty", ""),
        });
    }

    if (filters.cuisine) {
        badges.push({
            key: "cuisine",
            label: filters.cuisine,
            onRemove: () => updateFilter("cuisine", ""),
        });
    }

    if (filters.maxDuration !== null) {
        badges.push({
            key: "maxDuration",
            label: filters.maxDuration < 60 ? `≤ ${filters.maxDuration} min` : `≤ ${filters.maxDuration / 60}h`,
            onRemove: () => updateFilter("maxDuration", null),
        });
    }

    if (badges.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mb-4">
            <AnimatePresence mode="popLayout">
                {badges.map((badge) => (
                    <motion.span
                        key={badge.key}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                    >
                        {badge.label}
                        <button
                            type="button"
                            onClick={badge.onRemove}
                            className="tap ml-1 rounded-full p-0.5 transition-colors hover:bg-primary/20"
                            aria-label={t("removeFilter", { label: badge.label })}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </motion.span>
                ))}
            </AnimatePresence>
        </div>
    );
}
