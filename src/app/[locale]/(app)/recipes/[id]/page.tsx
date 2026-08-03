"use client"

import { Beef, Circle, CircleCheck, Flame, User, Clock, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Recipe } from "@/features/recipes/types/recipe";
import { RecipeProvider } from "@/features/recipes/api/recipe-provider";
import { PiBowlFoodLight, PiFireSimpleThin } from "react-icons/pi";
import { Button } from "@/components/ui/button";
import { DetailRecipeSkeleton } from "@/features/recipes/components/detail-recipe-skeleton";
import RecipeIAChat from "@/features/recipes/components/recipe-ia-chat";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

const NutritionCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) => {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-border/60 bg-surface-raised p-3 text-center shadow-sm">
      <div className="mb-2 rounded-full bg-primary/10 p-2 text-lg text-primary">
        {icon}
      </div>
      <span className="max-w-full truncate font-mono text-body font-bold tabular">{value}</span>
      <span className="max-w-full truncate font-mono text-label uppercase text-muted-foreground">{title}</span>
    </div>
  );
};

const Instruction = ({ instruction, index }: { instruction: string; index: number }) => {
  const [isChecked, setIsChecked] = useState(false);
  const t = useTranslations("RecipeDetail");

  return (
    <button
      type="button"
      onClick={() => setIsChecked(!isChecked)}
      className={`group flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all sm:gap-4 sm:p-4 ${isChecked
        ? "bg-primary/5 border-primary/20"
        : "bg-white/40 dark:bg-zinc-900/40 border-transparent hover:bg-white/60 dark:hover:bg-zinc-900/60"
        }`}
    >
      <div className={`mt-1 flex-shrink-0 transition-colors ${isChecked ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"}`}>
        {isChecked ? <CircleCheck className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
      </div>
      <div className="flex-1">
        <span className="mb-1 block font-mono text-label font-bold text-muted-foreground">{t("step", { number: index + 1 })}</span>
        <p className={`text-body leading-relaxed transition-opacity ${isChecked ? "line-through opacity-50" : ""}`}>
          {instruction}
        </p>
      </div>
    </button>
  )
}

const DetailRecipe = () => {
  const params = useParams()
  const [recipe, setRecipe] = useState<Recipe>()
  const [showFullDescription, setShowFullDescription] = useState(false)
  const t = useTranslations("RecipeDetail");

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const id = params.id as string
        if (id) {
          const { recipe } = await RecipeProvider.getRecipe(id);
          if (recipe) setRecipe(recipe);
        }
      } catch (error) {
        console.error("Error fetching recipe:", error);
      }
    };

    fetchRecipe();
  }, [params.id]);

  return (
    <div>
      {
        !recipe ? (<DetailRecipeSkeleton />) : (
          <div className="relative text-foreground">
            <div className="relative z-10">
              <div className="w-full">
                {/* One column on phones; from lg the photo and its figures
                    become a sticky rail beside the method, which is what the
                    `lg:col-span-*` on the text column always assumed. */}
                <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
                  {/* Left Column: Image & Quick Stats */}
                  <div className="space-y-5 lg:sticky lg:top-20 lg:col-span-5">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border/60 shadow-lifted"
                    >
                      <img
                        className="h-full w-full object-cover"
                        src={recipe.image}
                        alt={recipe.recipe_name}
                        
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white sm:p-6">
                        <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-meta font-medium sm:gap-3">
                          <span className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 backdrop-blur-md">
                            <Clock className="w-4 h-4" /> {recipe.duration_to_cook} min
                          </span>
                          <span className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 backdrop-blur-md">
                            <User className="w-4 h-4" /> {recipe.servings} {t("servings")}
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Nutrition Grid - Mobile/Desktop */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <NutritionCard
                        title={t("nutrition.calories")}
                        value={`${recipe.nutrition_facts["calories"]}`}
                        icon={<PiBowlFoodLight />}
                      />
                      <NutritionCard
                        title={t("nutrition.protein")}
                        value={`${recipe.nutrition_facts["protein"]}`}
                        icon={<Beef />}
                      />
                      <NutritionCard
                        title={t("nutrition.fat")}
                        value={`${recipe.nutrition_facts["fat"]}`}
                        icon={<PiFireSimpleThin />}
                      />
                      <NutritionCard
                        title={t("nutrition.carbs")}
                        value={`${recipe.nutrition_facts["carbohydrates"]}`}
                        icon={<Flame />}
                      />
                    </div>
                  </div>

                  {/* Right Column: Details & Instructions */}
                  <div className="min-w-0 space-y-8 pb-24 lg:col-span-7">
                    <div>
                      <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-4 font-mono text-title font-bold tracking-tight sm:mb-6"
                      >
                        {recipe.recipe_name}
                      </motion.h1>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="prose dark:prose-invert max-w-none"
                      >
                        <p className="max-w-[68ch] font-mono text-body leading-relaxed text-muted-foreground">
                          {showFullDescription
                            ? recipe.description
                            : `${recipe.description?.substring(0, 180)}...`}
                          <button
                            className="tap ml-2 rounded-md font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => setShowFullDescription(!showFullDescription)}
                          >
                            {showFullDescription ? t("readLess") : t("readMore")}
                          </button>
                        </p>
                      </motion.div>
                    </div>

                    {/* Ingredients Section */}
                    <div>
                      <h2 className="mb-4 flex items-center gap-2 font-mono text-body font-bold">
                        <span className="w-8 h-1 bg-primary rounded-full inline-block"></span>
                        {t("ingredients")}
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {recipe.ingredients.map((ingredient, index) => (
                          <span
                            key={index}
                            className="rounded-xl border border-transparent bg-secondary/50 px-3 py-2 text-body font-medium text-secondary-foreground transition-colors hover:border-primary/20 hover:bg-secondary sm:px-4"
                          >
                            {ingredient}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Instructions Section */}
                    <div>
                      <h2 className="mb-6 flex items-center gap-2 font-mono text-body font-bold">
                        <span className="w-8 h-1 bg-primary rounded-full inline-block"></span>
                        {t("instructions")}
                      </h2>
                      <div className="space-y-3">
                        {recipe.instructions.map((instruction, index) => (
                          <Instruction key={index} index={index} instruction={instruction} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Share Button. It has to clear the bottom tab bar, which
                only leaves the screen edge free from lg, where navigation
                becomes a rail. */}
            <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] left-4 z-50 lg:bottom-6 lg:left-6">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Button
                  onClick={async () => {
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: recipe.recipe_name,
                          text: t("shareText", { name: recipe.recipe_name }),
                          url: window.location.href,
                        });
                      } catch (error) {
                        console.error("Error sharing:", error);
                      }
                    } else {
                      // Fallback for browsers that don't support share
                      navigator.clipboard.writeText(window.location.href);
                      alert(t("shareCopied"));
                    }
                  }}
                  size="icon"
                  className="h-14 w-14 rounded-full shadow-xl  border-white dark:border-zinc-900 bg-primary"
                >
                  <Share2 className="h-6 w-6" />
                </Button>
              </motion.div>
            </div>

            {/* AI Chef Assistant */}
            <RecipeIAChat />
          </div>
        )
      }

    </div>
  );
};

export default DetailRecipe;
