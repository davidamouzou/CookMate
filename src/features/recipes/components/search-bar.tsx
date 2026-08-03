"use client";

import { Search, X } from "lucide-react";
import { useRecipes } from "@/features/recipes/context/recipe-context";
import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";

export function SearchBar() {
    const { searchQuery, setSearchQuery } = useRecipes();
    const [localQuery, setLocalQuery] = useState(searchQuery);
    const t = useTranslations("Header");
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(localQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [localQuery, setSearchQuery]);

    // Sync local state when external state changes
    useEffect(() => {
        setLocalQuery(searchQuery);
    }, [searchQuery]);

    const handleClear = () => {
        setLocalQuery("");
        setSearchQuery("");
        inputRef.current?.focus();
    };

    return (
        <div className="rounded-full mt-5 justify-end flex items-center relative">
            <input
                ref={inputRef}
                className="focus:bg-transparent shadow-md border outline-none text-sm pl-8 pr-20 py-4 rounded-full bg-transparent w-full"
                type="search"
                name="search"
                id="search"
                placeholder={t("searchPlaceholder")}
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
            />
            {localQuery && (
                <button
                    onClick={handleClear}
                    className="absolute right-14 top-1/2 transform -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear search"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
            <button className="bg-slate-800 rounded-full text-white absolute right-1 top-1/2 transform -translate-y-1/2 p-2">
                <Search className="h-5 w-5" />
            </button>
        </div>
    );
}
