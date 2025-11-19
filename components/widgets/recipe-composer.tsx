"use client";

import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button"; // Assuming these are Shadcn/UI components
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, SlidersHorizontal, WandSparkles } from "lucide-react";
import chooseImage from "@/app/utils/choose_image"; // Assuming this is a utility function

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Recipe } from "@/app/api/entities/recipe"; // Assuming these are your API entities/providers
import { RecipeProvider } from "@/app/api/provider/recipe_provider";
import RecipeCard from "./recipe_card"; // Assuming RecipeCard component exists
import { toast, Toaster } from "sonner"; // Import Toaster from sonner
import { useEffect } from "react";
import { uploadUrlImage } from "@/app/utils/upload_file";

// RecipeListPanel component to display a list of recipes in a sheet
export function RecipeListPanel({
    open = false,
    recipe = null,
    onOpenChange,
    prompt
}: {
    open?: boolean,
    recipe?: Recipe | null,
    onOpenChange: (isOpen: boolean) => void,
    prompt?: string
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
                {/* Trigger is handled externally in this setup */}
            </SheetTrigger>
            <SheetContent className="overflow-y-scroll">
                <SheetHeader>
                    <SheetTitle>Recettes</SheetTitle>
                    {prompt && (
                        <SheetDescription className="text-xs bg-gray-500/10 rounded-md p-2 italic">{prompt}</SheetDescription>
                    )}
                </SheetHeader>
                <div className="grid gap-4 py-4">
                    {recipe ? (
                        <RecipeCard recipe={recipe} />
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Aucune recette à afficher pour le moment.</p>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

// Main RecipeCreator component
const RecipeCreator: React.FC = () => {
    // State variables for search, filters, UI, and data
    const [search, setSearch] = useState("");
    const [mealType, setMealType] = useState("");
    const [cookTime, setCookTime] = useState([15]); // Default cook time 30 mins
    const [level, setLevel] = useState("");
    const [allergens, setAllergens] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false); // Renamed for clarity
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [isLoading, setIsLoading] = useState(false); // Renamed for clarity
    const [onFocus, setOnFocus] = useState(false);
    const [currentPrompt, setCurrentPrompt] = useState(""); // Renamed for clarity
    const [language, setLanguage] = useState("fr"); // Default

    useEffect(() => {
        if (typeof window !== "undefined" && window.navigator && window.navigator.language) {
            const lang = window.navigator.language.slice(0, 2);
            if (["fr", "en", "es", "de"].includes(lang)) {
                setLanguage(lang);
            }
        }
    }, []);

    // Handler for choosing an image to generate recipes
    const chooseImageHandler = async () => {
        const image = await chooseImage();
    };

    // Handler for saving recipes
    const saveRecipesHandler = useCallback(async (recipeToSave: Recipe): Promise<Recipe | null> => {
        try {
            const { success, recipe } = await RecipeProvider.saveRecipe(recipeToSave);
            if (success) {
                // Optionally: toast or notification
                return recipe;
            }
            return null;
        } catch (error) {
            console.error("Error saving recipes:", error);
            return null;
        }
    }, []);

    // Handler for generating recipes based on text description and filters
    const generateRecipesHandler = async () => {
        if (search.length < 3 && !mealType && !level && !allergens) {
            toast.warning("Veuillez affiner votre recherche", {
                description: "Entrez des ingrédients, un type de repas, un niveau ou des allergènes.",
            });
            return;
        }

        setIsLoading(true);
        const descriptionParts = [
            search,
            mealType ? `type de repas: ${mealType}` : '',
            `durée <= ${cookTime[0]} minutes`,
            level ? `niveau: ${level}` : '',
            allergens ? `éviter les allergènes: ${allergens}` : ''
        ].filter(Boolean).join(", "); // Construct a comprehensive description

        setCurrentPrompt(descriptionParts); // Set the prompt for the sheet

        const toastId = toast.loading("Génération des recettes en cours...", {
            description: `Basé sur: ${descriptionParts}`,
        });

        // Clear search input after starting generation
        setSearch(""); 

        const res = await RecipeProvider.generateRecipe(descriptionParts, language);

        if (res.success) {
            const imageGenerate = await RecipeProvider.generateImage(res.recipe?.description ?? "");
            const imageUpload = await uploadUrlImage(imageGenerate ?? "");
            res.recipe!.image = imageUpload || "";
            const savedRecipe = await saveRecipesHandler(res.recipe!);
            setRecipe(savedRecipe);
            setIsSheetOpen(true);

            toast.success("Recettes générées avec succès!", {
                id: toastId,
                description: `Recette créée.`,
            });

        } else {
            toast.error(res.message || "Erreur de génération", {
                id: toastId,
                description: "Veuillez réessayer plus tard.",
            });
        }

        setIsLoading(false);
    };

    // Handler to close the recipe list sheet
    const handleCloseSheet = (isOpen: boolean) => {
        setIsSheetOpen(isOpen);
    };

    return (
        <>
            <Toaster richColors position="top-right" />
            <RecipeListPanel
                open={isSheetOpen}
                recipe={recipe}
                onOpenChange={handleCloseSheet}
                prompt={currentPrompt}
            />
            {/* Main input area for recipe generation */}
            <div className={`fixed transition-all duration-300 z-40 flex justify-center items-center left-2 right-2 bottom-2`}>
                <div className={`mt-12 border p-2 backdrop-blur-2xl  md:w-2/3 rounded-2xl bg-background/80 ${(onFocus || search.length > 0) ? 'w-full' : ''}`}>
                    <div className="flex gap-2"> {/* items-start to align button and textarea top */}
                        <Button onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            chooseImageHandler();
                        }} size="icon" variant="ghost" disabled={isLoading}>
                            <Plus />
                        </Button>
                        <textarea
                            rows={onFocus ? 4 : 2}
                            className="bg-transparent mt-1.5 w-full outline-none resize-none"
                            name="search"
                            id="search"
                            placeholder="Décrivez votre plat idéal, ex: 'Poulet curry coco, rapide et facile'..."
                            value={search}
                            onChange={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSearch(e.target.value)
                            }}
                            onFocus={() => setOnFocus(true)}
                            onBlur={() => setOnFocus(false)}
                        ></textarea>
                    </div>
                    <div className="flex items-center justify-between">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="secondary" size="sm" disabled={isLoading}>
                                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                                    Filtres
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="mx-2 sm:mx-6 w-full sm:w-80">
                                <div className="space-y-4 p-1">
                                    <h4 className="font-medium leading-none mb-2">Options de filtrage</h4>
                                    <div>
                                        <Label htmlFor="languageSelect" className="block text-sm font-medium mb-1">Langue</Label>
                                        <Select
                                            value={language}
                                            onValueChange={setLanguage}
                                            disabled={isLoading}
                                        >
                                            <SelectTrigger id="languageSelect">
                                                <SelectValue placeholder="Langue" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fr">Français</SelectItem>
                                                <SelectItem value="en">English</SelectItem>
                                                <SelectItem value="es">Español</SelectItem>
                                                <SelectItem value="de">Deutsch</SelectItem>
                                                {/* Add more languages as needed */}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="mealTypeSelect" className="block text-sm font-medium mb-1">Type de repas</Label>
                                        <Select value={mealType} onValueChange={setMealType} disabled={isLoading}>
                                            <SelectTrigger id="mealTypeSelect">
                                                <SelectValue placeholder="Type de repas" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="anoter">Aucun</SelectItem>
                                                <SelectItem value="breakfast">Petit déjeuner</SelectItem>
                                                <SelectItem value="lunch">Déjeuner</SelectItem>
                                                <SelectItem value="dinner">Dîner</SelectItem>
                                                <SelectItem value="dessert">Dessert</SelectItem>
                                                <SelectItem value="snack">En-cas</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="cookTimeSlider" className="block text-sm font-medium mb-1">
                                            Temps de cuisson (max)
                                        </Label>
                                        <Slider
                                            id="cookTimeSlider"
                                            value={cookTime}
                                            onValueChange={setCookTime}
                                            max={180} // Increased max time
                                            step={5}
                                            disabled={isLoading}
                                        />
                                        <div className="text-xs text-muted-foreground mt-1 text-right">
                                            {cookTime[0]} min
                                        </div>
                                    </div>
                                    <Select value={level} onValueChange={setLevel} disabled={isLoading}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Niveau de difficulté" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="easy">Débutant</SelectItem>
                                            <SelectItem value="medium">Intermédiaire</SelectItem>
                                            <SelectItem value="hard">Chef étoilé</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div>
                                        <Label htmlFor="allergensInput" className="block text-sm font-medium mb-1">Allergènes à éviter</Label>
                                        <Input
                                            id="allergensInput"
                                            placeholder="Ex: gluten, arachides..."
                                            value={allergens}
                                            onChange={e => setAllergens(e.target.value)}
                                            disabled={isLoading}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Séparez par des virgules.</p>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Button
                            size="icon"
                            onClick={generateRecipesHandler}
                            disabled={isLoading || (search.length < 3 && !mealType && !level && !allergens)} // Disable if loading or no input
                            className="bg-gradient-to-r from-gray-800 via-gray-600 to-gray-700 hover:from-gray-900 hover:via-gray-700 hover:to-black text-white rounded-full p-2 shadow-lg"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center h-5 w-5"> {/* Adjusted size */}
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-background border-t-transparent"></div> {/* Adjusted border */}
                                </div>
                            ) : (
                                <WandSparkles className="h-5 w-5" />
                            )}
                            <span className="sr-only">Générer les recettes</span>
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RecipeCreator;

// Mock implementations for missing imports (for standalone testing if needed)
// Remove these if you have the actual implementations in your project

//_BEGIN_MOCK_ONLY_
if (typeof chooseImage === 'undefined') {
    // @ts-ignore
    global.chooseImage = async () => {
        console.log("chooseImage mock called");
        // Simulate image selection, return a mock File or data URL string
        // For simplicity, returning a string. In reality, this would be a File object.
        // return new File(["mock image content"], "mock.jpg", { type: "image/jpeg" });
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

    };
}

if (typeof RecipeProvider === 'undefined') {
    // @ts-ignore
    global.RecipeProvider = {
        generateWithImage: async (image: any): Promise<Recipe[]> => {
            console.log("RecipeProvider.generateWithImage mock called with:", image ? 'image data' : 'no image');
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
            // @ts-ignore
            return [{ id: 'img_recipe_1', name: 'Salade d\'image', description: 'Une délicieuse salade générée à partir d\'une image.', ingredients: ['Laitue', 'Tomate', 'Concombre'], instructions: ['Laver', 'Couper', 'Mélanger'], cookTime: 10, level: 'easy' }];
        },
        generateWithDescription: async (description: string): Promise<Recipe[]> => {
            console.log("RecipeProvider.generateWithDescription mock called with:", description);
            await new Promise(resolve => setTimeout(resolve, 1500));
            // @ts-ignore
            return [{ id: 'desc_recipe_1', name: `Recette pour "${description.substring(0, 20)}..."`, description: `Recette basée sur: ${description}`, ingredients: ['Ingrédient A', 'Ingrédient B'], instructions: ['Étape 1', 'Étape 2'], cookTime: 30, level: 'medium' }];
        },
        saveRecipe: async (recipe: Recipe): Promise<boolean> => {
            console.log("RecipeProvider.saveRecipe mock called for:", recipe.recipe_name);
            await new Promise(resolve => setTimeout(resolve, 500));
            return Math.random() > 0.1; // Simulate occasional save failure
        }
    };
}

if (typeof RecipeCard === 'undefined') {
    // @ts-ignore
    global.RecipeCard = ({ recipe }: { recipe: Recipe }) => (
        <div style={{ border: '1px solid #ccc', padding: '10px', margin: '5px', borderRadius: '5px' }}>
            <h4>{recipe.recipe_name}</h4>
            <p>{recipe.description}</p>
            <small>Temps: {recipe.duration_to_cook} min, Niveau: {recipe.difficulty}</small>
        </div>
    );
}