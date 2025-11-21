"use client";

import { useEffect, useState } from "react";
import { Recipe } from "../api/entities/recipe";
import { RecipeProvider } from "../api/provider/recipe_provider";
import Header from "@/components/widgets/header";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SliderCard } from "@/components/widgets/slider_card";
import RecipeCard from "@/components/widgets/recipe_card";
import { RecipeSection } from "@/components/widgets/image_recipe_card";
import { CategorySection } from "@/components/widgets/category_card";
import { Search } from "lucide-react";
import arrow from "@/app/assets/icons/arrow.png";
import RecipeCreator from "@/components/widgets/recipe-composer";
import { SkeletonCard } from "@/components/widgets/skeleton-card";

export default function Home() {
  const [recipesData, setRecipes] = useState<Recipe[]>([]);
  const [lastRecipeIndex, setLastRecipeIndex] = useState(0);
  const [recipesToLoad, setRecipesToLoad] = useState(25);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const { recipes } = await RecipeProvider.getLastRecipes(lastRecipeIndex, recipesToLoad);
        setRecipes([...recipesData, ...recipes]);
      } catch (error) {
        console.error("Error fetching recipes:", error);
        setRecipes([]);
      }
      setLoading(false);
    };
    fetchRecipes();
  }, [lastRecipeIndex, recipesToLoad]);

  return (
    <main className="overflow-x-hidden w-screen">
      <div className="lg:mx-16 m-4 md:m-8">
        <Header />
        <section className="flex flex-col md:flex-row mt-12 md:space-x-8 space-y-6 lg:space-y-0">
          <div className="lg:w-1/2 w-full">
            <h2 className="text-4xl lg:text-6xl font-bold">
              <div>
                <div className={`ml-12 bg-[url('../assets/images/text_bg.jpg')] bg-clip-text bg-cover bg-center text-transparent`}>
                  <span
                    className="text-transparent bg-clip-text bg-cover bg-gradient-to-r from-85% 
                    from-slate-800 to-transparent
                    dark:from-white
                    light:from-slate-800 light:to-transparent"
                  >
                    Fresh
                  </span>{" "}
                  Food
                </div>
                <div className="flex">
                  <div className="italic font-medium pb-2 pr-2 text-green-800 dark:text-green-600 text-3xl lg:text-4xl">
                    With{" "}
                  </div>
                  Great
                  <span className="relative ml-4">
                    Taste
                    <Image className="absolute w-40 top-0 left-4" src={arrow} alt="fleche" />
                  </span>
                </div>
              </div>
            </h2>
            <p className="mt-12">
              Overall, &quot;Creating Delicious Dishes&quot; is an essential
              resource for anyone looking to start a food business or take their
              culinary skills to the next level.
            </p>
            <div className="rounded-full mt-5 justify-end flex items-center">
              <input
                readOnly={true}
                className="focus:bg-transparent shadow-md border outline-none text-sm pl-8 py-4 rounded-full bg-transparent w-full"
                type="search"
                name="search"
                id="search"
                placeholder="Find Great Food"
              />
              <button className="bg-slate-800 rounded-full text-white absolute mr-1">
                <Search className="m-3 h-6 w-6" />
              </button>
            </div>
            <RecipeCreator />
          </div>
          <div className="lg:w-1/2 w-full">
            <SliderCard />
          </div>
        </section>

        <h2 className="mt-12 font-bold text-2xl mb-4">Popular Recipes</h2>
        <div className="flex flex-col md:flex-row gap-4 md:gap-8">
          <div className="md:w-1/2 w-full flex justify-center items-center">
            <CategorySection />
          </div>
          <div className="w-full md:w-1/2 flex justify-center items-center">
            <RecipeSection />
          </div>
        </div>

        <hr className="my-8" />
        <div className="my-5">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 py-2">
            {recipesData.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}

            {
              loading && (Array(20).fill(0).map((_, index) => (
                <SkeletonCard key={index} />
              )))
            }
          </div>
        </div>
        <div className="flex justify-center space-x-4">
          <Button
            onClick={() => {
              setLoading(true);
              setLastRecipeIndex(recipesToLoad + 1)
              setRecipesToLoad(recipesToLoad + 20)
            }}
            variant={'outline'}
          >
            Show more
          </Button>
        </div>
        <div className="h-36" />
      </div>
    </main>
  );
}