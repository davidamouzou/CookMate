"use client";

import RecipeCard from "@/components/layout/recipe_card";
import { SkeletonCard } from "@/components/layout/skeleton-card";
import { Button } from "@/components/ui/button";
import { useRecipes } from "@/app/context/RecipeContext";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";

export function RecipeList() {
    const { filteredRecipes, loading, loadMore } = useRecipes();
    const t = useTranslations('RecipeList');

    return (
        <section className="w-full">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold tracking-tight">{t('popularRecipes')}</h2>
                {/* Filter buttons could go here */}
            </div>

            <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
                <AnimatePresence mode="popLayout">
                    {filteredRecipes.map((recipe) => (
                        <RecipeCard key={recipe.id} recipe={recipe} />
                    ))}
                </AnimatePresence>

                {loading &&
                    Array(8)
                        .fill(0)
                        .map((_, index) => (
                            <motion.div
                                key={`skeleton-${index}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <SkeletonCard />
                            </motion.div>
                        ))}
            </motion.div>

            <div className="flex justify-center mt-12 mb-16">
                <Button
                    onClick={loadMore}
                    variant="outline"
                    size="lg"
                    disabled={loading}
                    className="rounded-full px-8 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            {t('loading')}
                        </span>
                    ) : (
                        t('loadMore')
                    )}
                </Button>
            </div>
        </section>
    );
}
