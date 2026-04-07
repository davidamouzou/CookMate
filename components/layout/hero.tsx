"use client";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
    Utensils,
    Soup,
    Salad,
    Carrot,
    Cake,
    Heart,
    Zap,
    ChefHat
} from "lucide-react";
import { useRecipes } from "@/app/context/RecipeContext";

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

export function Hero() {
    const t = useTranslations('Hero');
    const { filters, updateFilter, clearFilters } = useRecipes();

    const categories = [
        { key: 'all', icon: Utensils },
        { key: 'appetizers', icon: Soup },
        { key: 'mainCourses', icon: ChefHat },
        { key: 'saladsSides', icon: Salad },
        { key: 'vegetarian', icon: Carrot },
        { key: 'desserts', icon: Cake },
        { key: 'healthy', icon: Heart },
        { key: 'quickEasy', icon: Zap },
    ];

    const getActiveCategory = () => {
        if (!filters.mealType && !filters.difficulty) return 'all';
        
        for (const [key, mapping] of Object.entries(CATEGORY_TO_FILTER)) {
            if (key === 'all') continue;
            if (mapping.mealType && filters.mealType === mapping.mealType) return key;
            if (mapping.difficulty && filters.difficulty === mapping.difficulty) return key;
        }
        return null;
    };

    const handleCategoryClick = (key: string) => {
        if (key === 'all') {
            clearFilters();
            return;
        }

        const mapping = CATEGORY_TO_FILTER[key];
        if (mapping.mealType) {
            updateFilter("mealType", filters.mealType === mapping.mealType ? "" : mapping.mealType);
            updateFilter("difficulty", "");
        } else if (mapping.difficulty) {
            updateFilter("difficulty", filters.difficulty === mapping.difficulty ? "" : mapping.difficulty);
            updateFilter("mealType", "");
        }
    };

    const activeCategory = getActiveCategory();

    return (
        <div className="lg:w-1/2 w-full flex flex-col justify-center space-y-8 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h2 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight text-foreground">
                    {t('titleStart')} <br />
                    <span className="text-primary">{t('titleHighlight')}</span> {t('titleEnd')}
                </h2>
                <p className="mt-6 text-lg text-muted-foreground max-w-md leading-relaxed">
                    {t('description')}
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-4"
            >
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                    {t('question')} <span className="text-primary">{t('questionHighlight')}</span>?
                </h3>

                <div className="flex flex-wrap gap-3">
                    {categories.map((cat, index) => {
                        const isActive = activeCategory === cat.key;
                        return (
                            <motion.button
                                key={index}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleCategoryClick(cat.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${isActive
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                    : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary hover:text-primary'
                                    }`}
                            >
                                <cat.icon className="w-4 h-4" />
                                {t(`categories.${cat.key}`)}
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>
        </div>
    );
}
