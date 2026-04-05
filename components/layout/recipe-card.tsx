import { Recipe } from "@/features/entities/recipe";
import { useRouter } from "@/i18n/routing";
import { Clock, ChefHat, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
  const router = useRouter();
  const t = useTranslations("RecipeCard");

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
      className="group relative w-full bg-card rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 border border-border/50"
      tabIndex={0}
      role="button"
      aria-label={t("viewRecipe", { name: recipe.recipe_name })}
    >
      {/* Image Section */}
      <div className="relative h-56 w-full overflow-hidden">
        <img
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
          src={recipe.image}
          alt={recipe.recipe_name}
          width={500}
          height={500}
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Floating Action Button */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
          <ArrowUpRight className="w-5 h-5 text-primary" />
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {recipe.cuisine && (
            <span className="px-2.5 py-1 text-xs font-semibold bg-black/50 backdrop-blur-md text-white rounded-full">
              {recipe.cuisine}
            </span>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 space-y-3">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
            {recipe.recipe_name}
          </h3>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{recipe.duration_to_cook || 30} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ChefHat className="w-4 h-4" />
            <span className="capitalize">{difficultyLabel}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RecipeCard;
