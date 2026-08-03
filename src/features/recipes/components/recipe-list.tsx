"use client";

import RecipeCard from "@/features/recipes/components/recipe-card";
import { SkeletonCard } from "@/features/recipes/components/skeleton-card";
import { Button } from "@/components/ui/button";
import { useRecipes } from "@/features/recipes/context/recipe-context";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { ActiveFilterBadges } from "@/features/recipes/components/filter-bar";

export function RecipeList() {
    const { filteredRecipes, loading, loadMore, hasActiveFilters } = useRecipes();
    const t = useTranslations('RecipeList');

    return (
        <section className="w-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-mono text-xl font-bold tracking-tight">{t('popularRecipes')}</h2>
            </div>

            <ActiveFilterBadges />

            {hasActiveFilters && filteredRecipes.length === 0 && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                    <p className="font-mono text-sm">{t('noResults')}</p>
                </div>
            )}

            <motion.div
                layout
                className="grid grid-cols-2 gap-3"
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
