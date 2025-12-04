"use client";

import { Search } from "lucide-react";
import { useRecipes } from "@/app/context/RecipeContext";

export function SearchBar() {
    const { searchQuery, setSearchQuery } = useRecipes();

    return (
        <div className="rounded-full mt-5 justify-end flex items-center relative">
            <input
                className="focus:bg-transparent shadow-md border outline-none text-sm pl-8 py-4 rounded-full bg-transparent w-full"
                type="search"
                name="search"
                id="search"
                placeholder="Find Great Food"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="bg-slate-800 rounded-full text-white absolute right-1 top-1/2 transform -translate-y-1/2 p-2">
                <Search className="h-5 w-5" />
            </button>
        </div>
    );
}
