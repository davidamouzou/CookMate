"use client"

import { Beef, ChevronLeft, Circle, CircleCheck, CookingPot, Flame, Printer, Share, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Recipe } from "@/api/entities/recipe";
import { RecipeProvider } from "@/api/provider/recipe_provider";
import Image from "next/image";
import { PiBowlFoodLight, PiFireSimpleThin } from "react-icons/pi";
import { Button } from "@/components/ui/button";
import { DetailRecipeSkeleton } from "@/components/widgets/detail-recipe-skeleton";


const NutritionCard = ({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="p-2 rounded-lg bg-slate-200 text-black text-2xl">
        {icon}
      </div>
      <h3 className="line-clamp-2 text-sm">{title}</h3>
    </div>
  );
};

const Instruction = ({ instruction }: { instruction: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div
      onClick={() => setIsOpen(!isOpen)}
      className="flex rounded-lg text-sm space-x-2 cursor-pointer"
    >
      <div>{isOpen ? <CircleCheck className="w-4 h-4" /> : <Circle className="w-4 h-4" />}</div>
      <div className={isOpen ? "line-through" : ""}>{instruction}</div>
    </div>
  )
}

const DetailRecipe = () => {
  const params = useParams()
  const [recipe, setRecipe] = useState<Recipe>()
  const [showFullDescription, setShowFullDescription] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const id = params.id as string
        if (id) {
          const { recipe } = await RecipeProvider.getRecipe(id);
          // Set recipe
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
    <div className="relative h-screen overflow-hidden">
      <Image
        className="h-full w-full absolute bottom-0 top-0 left-0 object-cover"
        src={recipe.image}
        alt={recipe.recipe_name}
        width={500}
        height={500}
      />
      <div className="absolute top-0 bottom-0 left-0 right-0 bg-background/80 backdrop-blur-3xl overflow-y-scroll md:overflow-y-hidden">
        <div className="sticky top-0 bg-background/40 backdrop-blur-3xl p-2 flex items-center justify-between">
          <Button
            onClick={() => router.push("/")}
            variant="secondary"><ChevronLeft />Back</Button>
          <div className="flex space-x-2">
            <Button
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: document.title,
                      text: "Découvre cette page !",
                      url: window.location.href,
                    });
                    console.log("Page partagée avec succès !");
                  } catch (error) {
                    console.error("Erreur lors du partage :", error);
                  }
                } else {
                  alert("Le partage n'est pas supporté sur ce navigateur.");
                }
              }}
              variant="ghost" size={"icon"}><Share /></Button>
            <Button
              onClick={() => window.print()}
              variant="ghost" size={"icon"}><Printer /></Button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row h-full">
          <div className="md:w-80 md:min-w-80 md:h-full bg-background/40 p-4 overflow-y-visible md:overflow-y-scroll">
            <Image
              className="rounded-xl w-full mb-5"
              src={recipe.image}
              alt={recipe.recipe_name}
              width={500}
              height={500}
            />
            <div>
              <div className="md:hidden block space-y-4 my-5">
                <h1 className="text-xl font-bold">{recipe.recipe_name}</h1>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-1">
                    <CookingPot className="w-4 h-4" />
                    <span>{`${recipe.duration_to_cook} min`}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{`${recipe.servings} reviews`}</span>
                  </div>
                </div>
                <p className="text-sm">
                  {showFullDescription
                    ? recipe.description
                    : `${recipe.description?.substring(0, 100)}...`}
                  <button
                    className="text-green-700 underline"
                    onClick={() => setShowFullDescription(!showFullDescription)}
                  >
                    {showFullDescription ? "Read less" : "Read more"}
                  </button>
                </p>
                <div className="flex gap-4 flex-wrap">
                  <NutritionCard
                    title={`${recipe.nutrition_facts["calories"]} kcal`}
                    icon={<PiBowlFoodLight />}
                  />
                  <NutritionCard
                    title={`${recipe.nutrition_facts["protein"]} Protein`}
                    icon={<Beef />}
                  />

                  <NutritionCard
                    title={`${recipe.nutrition_facts["fat"]} Fat`}
                    icon={<PiFireSimpleThin />}
                  />
                  <NutritionCard
                    title={`${recipe.nutrition_facts["carbohydrates"]} Carbohydrates`}
                    icon={<Flame />}
                  />
                </div>
              </div>
              <h2 className="font-bold">Ingredients</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <div
                    key={index}
                    className="bg-background/40 p-2 text-sm rounded-lg"
                  >
                    {ingredient}
                  </div>
                ))}
              </div>
              <div className="h-0 md:h-20"></div>
            </div>
          </div>
          {/* Recipe detail view */}
          <div className="overflow-y-visible md:overflow-y-scroll py-2 md:px-5">
            <div className="hidden md:block space-y-4 mb-5">
              <h1 className="text-2xl font-bold">{recipe.recipe_name}</h1>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-1">
                  <CookingPot className="w-4 h-4" />
                  <span>{`${recipe.duration_to_cook} min`}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>{`${recipe.servings} reviews`}</span>
                </div>
              </div>
              <p className="text-sm">
                {showFullDescription
                  ? recipe.description
                  : `${recipe.description?.substring(0, 100)}...`}
                <button
                  className="text-green-700 underline"
                  onClick={() => setShowFullDescription(!showFullDescription)}
                >
                  {showFullDescription ? "Read less" : "Read more"}
                </button>
              </p>
              <div className="flex gap-4 flex-wrap">
                <NutritionCard
                  title={`${recipe.nutrition_facts["calories"]} kcal`}
                  icon={<PiBowlFoodLight />}
                />
                <NutritionCard
                  title={`${recipe.nutrition_facts["protein"]} Protein`}
                  icon={<Beef />}
                />

                <NutritionCard
                  title={`${recipe.nutrition_facts["fat"]} Fat`}
                  icon={<PiFireSimpleThin />}
                />
                <NutritionCard
                  title={`${recipe.nutrition_facts["carbohydrates"]} Carbohydrates`}
                  icon={<Flame />}
                />
              </div>
            </div>
            {/* Recipe instructions component */}
            <div className="bg-background/40 md:rounded-xl p-4 mb-16">
              <h2 className="font-bold mb-4">Instructions</h2>
              <div className="space-y-4">
                {recipe.instructions.map((instruction, index) => (
                  <Instruction key={index} instruction={instruction} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailRecipe;