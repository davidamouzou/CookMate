import Image from "next/image";
import image1 from "@/app/assets/images/image_1.jpg";
import image2 from "@/app/assets/images/image_2.jpg";
import { StaticImageData } from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "../ui/carousel";

interface Recipe {
  title: string;
  photoUrl: StaticImageData;
}

const listRecipes: Recipe[] = [
  {
    title: "Stuffed eggplants with yogurt and salad",
    photoUrl: image1,
  },
  {
    title: "Autumn Soup",
    photoUrl: image2,
  },
];

export const RecipeSection = () => {
  return (
    <Carousel className="">
      <CarouselContent>
        {listRecipes.map((recipe, index) => (
          <CarouselItem key={index}>
            <ImageRecipeCard recipe={recipe} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};

export const ImageRecipeCard = ({ recipe }: { recipe: Recipe }) => {
  return (
    <div className="flex h-40 flex-col items-center justify-center w-full bg-slate-100 rounded-3xl relative overflow-hidden">
      <h3 className="text-lg font-bold text-white absolute bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent w-full">
        {recipe.title}
      </h3>
      <Image
        className="object-cover w-full h-full"
        src={recipe.photoUrl}
        alt={recipe.title}
      />
    </div>
  );
};
