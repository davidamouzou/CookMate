"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Recipe } from "@/api/entities/recipe";
import { RecipeProvider as ApiProvider } from "@/api/provider/recipe_provider";

interface RecipeContextType {
    recipes: Recipe[];
    loading: boolean;
    loadMore: () => Promise<void>;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filteredRecipes: Recipe[];
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider = ({ children }: { children: ReactNode }) => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastRecipeIndex, setLastRecipeIndex] = useState(0);
    const [recipesToLoad, setRecipesToLoad] = useState(25);
    const [searchQuery, setSearchQuery] = useState("");

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

        // We need to fetch with the NEW values. 
        // However, state updates are async. 
        // Ideally, we should pass these to fetchRecipes or use a ref/effect.
        // For simplicity, let's just call the API directly here with new values.

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

    const filteredRecipes = recipes.filter((recipe) =>
        recipe.recipe_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <RecipeContext.Provider
            value={{
                recipes,
                loading,
                loadMore,
                searchQuery,
                setSearchQuery,
                filteredRecipes,
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
