"use client"

import { Beef, Circle, CircleCheck, Flame, User, Clock, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Recipe } from "@/api/entities/recipe";
import { RecipeProvider } from "@/api/provider/recipe_provider";
import Image from "next/image";
import { PiBowlFoodLight, PiFireSimpleThin } from "react-icons/pi";
import { Button } from "@/components/ui/button";
import { DetailRecipeSkeleton } from "@/components/layout/detail-recipe-skeleton";
import RecipeIAChat from "@/components/layout/recipe-ia-chat";
import { motion } from "framer-motion";
import Header from "@/components/layout/header";

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
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/50 dark:bg-zinc-900/50 border border-white/20 shadow-sm backdrop-blur-md">
      <div className="p-3 rounded-full bg-primary/10 text-primary text-xl mb-2">
        {icon}
      </div>
      <span className="font-bold text-lg">{value}</span>
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{title}</span>
    </div>
  );
};

const Instruction = ({ instruction, index }: { instruction: string; index: number }) => {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div
      onClick={() => setIsChecked(!isChecked)}
      className={`group flex items-start space-x-4 p-4 rounded-xl transition-all cursor-pointer border ${isChecked
        ? "bg-primary/5 border-primary/20"
        : "bg-white/40 dark:bg-zinc-900/40 border-transparent hover:bg-white/60 dark:hover:bg-zinc-900/60"
        }`}
    >
      <div className={`mt-1 flex-shrink-0 transition-colors ${isChecked ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"}`}>
        {isChecked ? <CircleCheck className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
      </div>
      <div className="flex-1">
        <span className="text-xs font-bold text-muted-foreground mb-1 block">STEP {index + 1}</span>
        <p className={`text-base leading-relaxed transition-opacity ${isChecked ? "line-through opacity-50" : ""}`}>
          {instruction}
        </p>
      </div>
    </div>
  )
}

const DetailRecipe = () => {
  const params = useParams()
  const [recipe, setRecipe] = useState<Recipe>()
  const [showFullDescription, setShowFullDescription] = useState(false)

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

  if (!recipe) { return <DetailRecipeSkeleton /> }

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <Image
          className="h-full w-full object-cover opacity-20 dark:opacity-10 blur-3xl scale-110"
          src={recipe.image}
          alt="Background"
          width={100}
          height={100}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
      </div>

      <div className="relative z-10">
        <Header />

        <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Column: Image & Quick Stats */}
            <div className="lg:col-span-5 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-2xl border-4 border-white/20 dark:border-zinc-800/50"
              >
                <Image
                  className="h-full w-full object-cover"
                  src={recipe.image}
                  alt={recipe.recipe_name}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-center gap-4 text-sm font-medium mb-2">
                    <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 border border-white/10">
                      <Clock className="w-4 h-4" /> {recipe.duration_to_cook} min
                    </span>
                    <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 border border-white/10">
                      <User className="w-4 h-4" /> {recipe.servings} servings
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Nutrition Grid - Mobile/Desktop */}
              <div className="grid grid-cols-2 gap-4">
                <NutritionCard
                  title="Calories"
                  value={`${recipe.nutrition_facts["calories"]}`}
                  icon={<PiBowlFoodLight />}
                />
                <NutritionCard
                  title="Protein"
                  value={`${recipe.nutrition_facts["protein"]}`}
                  icon={<Beef />}
                />
                <NutritionCard
                  title="Fat"
                  value={`${recipe.nutrition_facts["fat"]}`}
                  icon={<PiFireSimpleThin />}
                />
                <NutritionCard
                  title="Carbs"
                  value={`${recipe.nutrition_facts["carbohydrates"]}`}
                  icon={<Flame />}
                />
              </div>
            </div>

            {/* Right Column: Details & Instructions */}
            <div className="lg:col-span-7 space-y-8 pb-24">
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-4xl md:text-5xl font-black tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70"
                >
                  {recipe.recipe_name}
                </motion.h1>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="prose dark:prose-invert max-w-none"
                >
                  <p className="text-lg leading-relaxed text-muted-foreground">
                    {showFullDescription
                      ? recipe.description
                      : `${recipe.description?.substring(0, 180)}...`}
                    <button
                      className="ml-2 text-primary font-semibold hover:underline decoration-2 underline-offset-4"
                      onClick={() => setShowFullDescription(!showFullDescription)}
                    >
                      {showFullDescription ? "Read less" : "Read more"}
                    </button>
                  </p>
                </motion.div>
              </div>

              {/* Ingredients Section */}
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-8 h-1 bg-primary rounded-full inline-block"></span>
                  Ingredients
                </h2>
                <div className="flex flex-wrap gap-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-secondary/50 hover:bg-secondary text-secondary-foreground rounded-xl text-sm font-medium transition-colors border border-transparent hover:border-primary/20"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>

              {/* Instructions Section */}
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-8 h-1 bg-primary rounded-full inline-block"></span>
                  Instructions
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

      {/* Floating Share Button */}
      <div className="fixed bottom-6 left-6 z-50">
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
                    text: `Check out this recipe for ${recipe.recipe_name}!`,
                    url: window.location.href,
                  });
                } catch (error) {
                  console.error("Error sharing:", error);
                }
              } else {
                // Fallback for browsers that don't support share
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied to clipboard!");
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
  );
};

export default DetailRecipe;