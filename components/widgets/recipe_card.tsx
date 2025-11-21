import { Recipe } from "@/api/entities/recipe";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Earth, Info } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";

const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/recipes/${recipe.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="w-full bg-background rounded-2xl overflow-hidden relative shadow cursor-pointer transition-transform hover:scale-[1.02] active:scale-100"
      tabIndex={0}
      role="button"
      aria-label={`Voir la recette ${recipe.recipe_name}`}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          handleCardClick(e as any);
        }
      }}
    >
      <div className="w-full rounded-t-2xl overflow-hidden z-0 relative h-48">
        <div className="flex items-center space-x-1 justify-between w-full absolute p-2 z-20">
          <div className="flex items-center space-x-1 bg-background/70 backdrop-blur-xl p-1 rounded-full w-fit text-xs">
            <Earth className="h-3 w-3" />
            <span className="line-clamp-1">{recipe.cuisine || "Cuisine"}</span>
          </div>
          <HoverCard>
            <HoverCardTrigger>
              <div
                className="bg-background/65 backdrop-blur-xl p-1 rounded-full"
                onClick={e => e.stopPropagation()}
                tabIndex={0}
                aria-label="Voir la description"
                onKeyDown={e => e.stopPropagation()}
              >
                <Info className="h-3.5 w-3.5" />
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="bg-background/60 rounded-xl border-0 backdrop-blur-xl text-sm max-w-xs">
              {recipe.description || <span className="italic text-muted-foreground">Aucune description</span>}
            </HoverCardContent>
          </HoverCard>
        </div>
        <Image
          className="object-cover w-full h-full transition-transform duration-300"
          src={recipe.image}
          alt={recipe.recipe_name}
          width={500}
          height={500}
          priority={true}
          draggable={false}
        />
        {/* Black gradient overlay */}
        <div className="absolute bottom-0 left-0 w-full h-28 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-10 pointer-events-none" />
      </div>
      <div className="p-2 absolute bottom-0 w-full z-20">
        <div className="h-20"></div>
        <div>
          <h1 className="font-semibold text-lg line-clamp-2 text-white p-1 drop-shadow">
            {recipe.recipe_name}
          </h1>
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
