import { RecipeList } from "@/components/layout/recipe-list";
import { RecipeProvider } from "@/app/context/RecipeContext";
import RecipeIAChat from "@/components/layout/recipe-ia-chat";
import Header from "@/components/layout/header";

export default function RecipesPage() {
    return (
        <RecipeProvider>
            <RecipeIAChat />
            <main className="min-h-screen bg-background">
                <div className="lg:mx-16 m-4 md:m-8">
                    <Header />
                    <div className="py-8">
                        <div className="mb-12 text-center">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                                Discover <span className="text-primary">Recipes</span>
                            </h1>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                Explore our vast collection of delicious recipes from around the world.
                            </p>
                        </div>

                        <RecipeList />

                    </div>
                </div>
            </main>
        </RecipeProvider>
    );
}
