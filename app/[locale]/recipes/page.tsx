import { RecipeList } from "@/components/layout/recipe-list";
import { RecipeProvider } from "@/app/context/RecipeContext";
import RecipeIAChat from "@/components/layout/recipe-ia-chat";
import Header from "@/components/layout/header";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
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
            <RecipeIAChat />
            <main className="min-h-screen bg-background">
                <div className="lg:mx-16 m-4 md:m-8">
                    <Header />
                    <div className="py-8">
                        <div className="mb-12 text-center">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                                {t("title")} <span className="text-primary">{t("titleHighlight")}</span>
                            </h1>
                            <p className="text-muted-foreground max-w-2xl mx-auto">
                                {t("description")}
                            </p>
                        </div>

                        <RecipeList />

                    </div>
                </div>
            </main>
        </RecipeProvider>
    );
}
