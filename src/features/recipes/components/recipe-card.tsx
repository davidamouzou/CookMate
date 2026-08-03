"use client";

import { Recipe } from "@/features/recipes/types/recipe";
import { useRouter } from "@/i18n/routing";
import { Clock, ChefHat, ArrowUpRight, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";

const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
  const router = useRouter();
  const t = useTranslations("RecipeCard");
  // Recipe photos still point at Firebase Storage, which currently answers 402.
  // Without this the broken-image alt text spills over the card layout.
  const [imageFailed, setImageFailed] = useState(!recipe.image);

  const difficultyKey = recipe.difficulty?.toLowerCase();
  const difficultyLabel =
    difficultyKey && ["easy", "medium", "hard"].includes(difficultyKey)
      ? t(`difficulty.${difficultyKey}`)
      : recipe.difficulty || t("difficulty.easy");

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/recipes/${recipe.id}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      onClick={handleCardClick}
      className="group relative w-full bg-surface-raised rounded-2xl overflow-hidden cursor-pointer shadow-tile hover:shadow-lifted transition-all duration-300 border border-border/60"
      tabIndex={0}
      role="button"
      aria-label={t("viewRecipe", { name: recipe.recipe_name })}
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-sunken">
        {imageFailed ? (
          <div
            className="flex h-full w-full items-center justify-center text-muted-foreground/40"
            role="img"
            aria-label={recipe.recipe_name}
          >
            <UtensilsCrossed className="h-8 w-8" aria-hidden />
          </div>
        ) : (
          <img
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
            src={recipe.image}
            alt={recipe.recipe_name}
            width={500}
            height={500}
            loading="lazy"
            draggable={false}
            onError={() => setImageFailed(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Floating Action Button */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
          <ArrowUpRight className="w-5 h-5 text-primary" />
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {recipe.cuisine && (
            <span className="max-w-[7.5rem] truncate rounded-full bg-black/55 px-2 py-0.5 font-mono text-[0.625rem] font-medium text-white backdrop-blur-md">
              {recipe.cuisine}
            </span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-1.5 p-3">
        <h3 className="line-clamp-2 font-mono text-xs font-bold leading-snug text-foreground transition-colors group-hover:text-track-orange">
          {recipe.recipe_name}
        </h3>

        {/* Meta Info */}
        <div className="flex items-center gap-2 font-mono text-[0.625rem] text-muted-foreground tabular">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 shrink-0" />
            {recipe.duration_to_cook || 30} min
          </span>
          <span className="flex items-center gap-1.5 capitalize">
            <ChefHat className="h-3 w-3 shrink-0" />
            {difficultyLabel}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default RecipeCard;
