import { SliderCard } from "@/components/layout/slider-card";
import { RecipeProvider } from "@/app/context/RecipeContext";
import { Hero } from "@/components/layout/hero";
import { RecipeList } from "@/components/layout/recipe-list";
import RecipeIAChat from "@/components/layout/recipe-ia-chat";
import Header from "@/components/layout/header";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { buildAlternates } from "@/lib/metadata";
import { type Locale } from "@/i18n/routing";

type HomePageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    alternates: buildAlternates(locale),
  };
}

export default function Home() {
  return (
    <RecipeProvider>
      <main className="overflow-x-hidden w-screen bg-background min-h-screen">
         <Header />
        <div className="lg:mx-16 m-4 md:m-8 relative">
          <section className="flex flex-col md:flex-row mt-8 md:mt-12 md:space-x-8 space-y-8 lg:space-y-0 min-h-auto md:min-h-[600px]">
            <Hero />
            <div className="lg:w-1/2 w-full h-full">
              <SliderCard />
            </div>
          </section>

          <hr className="my-12 border-border/40" />

          <RecipeList />
          <div className="h-36" />

          <RecipeIAChat />
        </div>
      </main>
    </RecipeProvider>
  );
}
