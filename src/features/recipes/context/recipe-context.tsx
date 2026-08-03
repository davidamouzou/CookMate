"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from "react";
import { Recipe } from "@/features/recipes/types/recipe";
import { RecipeProvider as ApiProvider } from "@/features/recipes/api/recipe-provider";

export type FilterState = {
    mealType: string;
    difficulty: string;
    cuisine: string;
    maxDuration: number | null;
};

const defaultFilters: FilterState = {
    mealType: "",
    difficulty: "",
    cuisine: "",
    maxDuration: null,
};

interface RecipeContextType {
    recipes: Recipe[];
    loading: boolean;
    loadMore: () => Promise<void>;
    /** Puts a just-saved recipe at the top of the list without a refetch. */
    addRecipe: (recipe: Recipe) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filters: FilterState;
    setFilters: (filters: FilterState) => void;
    updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
    clearFilters: () => void;
    filteredRecipes: Recipe[];
    availableCuisines: string[];
    hasActiveFilters: boolean;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider = ({ children }: { children: ReactNode }) => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastRecipeIndex, setLastRecipeIndex] = useState(0);
    const [recipesToLoad, setRecipesToLoad] = useState(25);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState<FilterState>(defaultFilters);

    // Fetch initial recipes on mount
    useEffect(() => {
        if (recipes.length === 0) {
            fetchRecipes().then()
        }
    }, []);

    const fetchRecipes = async () => {
        setLoading(true);
        try {
            const { recipes: newRecipes } = await ApiProvider.getLastRecipes(lastRecipeIndex, recipesToLoad);
            if (newRecipes && newRecipes.length > 0) {
                setRecipes((prev) => {
                    // Avoid duplicates just in case
                    const existingIds = new Set(prev.map(r => r.id));
                    const uniqueNewRecipes = newRecipes.filter(r => !existingIds.has(r.id));
                    const updated = [...prev, ...uniqueNewRecipes];
                    return updated;
                });
            }
        } catch (error) {
            console.error("Error fetching recipes:", error);
        }
        setLoading(false);
    };

    const loadMore = async () => {
        const nextIndex = recipesToLoad + 1;
        const nextToLoad = recipesToLoad + 20;

        setLastRecipeIndex(nextIndex);
        setRecipesToLoad(nextToLoad);

        setLoading(true);
        try {
            const { recipes: newRecipes } = await ApiProvider.getLastRecipes(nextIndex, nextToLoad);
            if (newRecipes && newRecipes.length > 0) {
                setRecipes((prev) => {
                    const existingIds = new Set(prev.map(r => r.id));
                    const uniqueNewRecipes = newRecipes.filter(r => !existingIds.has(r.id));
                    const updated = [...prev, ...uniqueNewRecipes];
                    return updated;
                });
            }
        } catch (error) {
            console.error("Error fetching more recipes:", error);
        }
        setLoading(false);
    };

    const addRecipe = useCallback((recipe: Recipe) => {
        setRecipes((prev) =>
            prev.some((existing) => existing.id === recipe.id) ? prev : [recipe, ...prev]
        );
    }, []);

    const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters(defaultFilters);
        setSearchQuery("");
    }, []);

    // Extract available cuisines from loaded recipes
    const availableCuisines = useMemo(() => {
        const cuisines = new Set<string>();
        recipes.forEach(r => {
            if (r.cuisine) cuisines.add(r.cuisine);
        });
        return Array.from(cuisines).sort();
    }, [recipes]);

    // Check if any filter is active
    const hasActiveFilters = useMemo(() => {
        return (
            searchQuery.trim() !== "" ||
            filters.mealType !== "" ||
            filters.difficulty !== "" ||
            filters.cuisine !== "" ||
            filters.maxDuration !== null
        );
    }, [searchQuery, filters]);

    // Multi-field search and filtering
    const filteredRecipes = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();

        return recipes.filter((recipe) => {
            // Text search across multiple fields
            if (query) {
                const searchableText = [
                    recipe.recipe_name,
                    recipe.description,
                    recipe.cuisine,
                    recipe.continent,
                    recipe.meal_type,
                    ...(recipe.ingredients || []),
                ].filter(Boolean).join(" ").toLowerCase();

                if (!searchableText.includes(query)) {
                    return false;
                }
            }

            // Filter by meal type
            if (filters.mealType && recipe.meal_type?.toLowerCase() !== filters.mealType.toLowerCase()) {
                return false;
            }

            // Filter by difficulty
            if (filters.difficulty && recipe.difficulty?.toLowerCase() !== filters.difficulty.toLowerCase()) {
                return false;
            }

            // Filter by cuisine
            if (filters.cuisine && recipe.cuisine?.toLowerCase() !== filters.cuisine.toLowerCase()) {
                return false;
            }

            // Filter by max duration
            if (filters.maxDuration !== null && recipe.duration_to_cook > filters.maxDuration) {
                return false;
            }

            return true;
        });
    }, [recipes, searchQuery, filters]);

    return (
        <RecipeContext.Provider
            value={{
                recipes,
                loading,
                loadMore,
                addRecipe,
                searchQuery,
                setSearchQuery,
                filters,
                setFilters,
                updateFilter,
                clearFilters,
                filteredRecipes,
                availableCuisines,
                hasActiveFilters,
            }}
        >
            {children}
        </RecipeContext.Provider>
    );
};

export const useRecipes = () => {
    const context = useContext(RecipeContext);
    if (context === undefined) {
        throw new Error("useRecipes must be used within a RecipeProvider");
    }
    return context;
};
