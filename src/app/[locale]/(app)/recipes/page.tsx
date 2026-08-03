import { RecipeList } from "@/features/recipes/components/recipe-list";
import { RecipeProvider } from "@/features/recipes/context/recipe-context";
import { CategoryChips } from "@/features/recipes/components/category-chips";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Marker } from "@/components/ui/marker";
import { buildAlternates } from "@/lib/metadata";
import { type Locale } from "@/i18n/routing";

type RecipesPageProps = {
    params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: RecipesPageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Metadata" });

    return {
        title: t("recipesTitle"),
        description: t("recipesDescription"),
        alternates: buildAlternates(locale, "/recipes"),
    };
}

export default async function RecipesPage() {
    const t = await getTranslations("RecipesPage");

    return (
        <RecipeProvider>
            <div className="flex min-h-full flex-col">
                <h1 className="font-mono text-2xl font-bold leading-tight tracking-tight">
                    {t("title")} <Marker tone="orange">{t("titleHighlight")}</Marker>
                </h1>
                <p className="mt-1.5 font-mono text-xs text-muted-foreground">
                    {t("description")}
                </p>

                <div className="mt-3">
                    <CategoryChips />
                </div>

                <div className="mt-4 flex-1">
                    <RecipeList />
                </div>
            </div>
        </RecipeProvider>
    );
}
