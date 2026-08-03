import Header from "@/components/layout/header";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { buildAlternates } from "@/lib/metadata";
import { type Locale } from "@/i18n/routing";

type AboutPageProps = {
    params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Metadata" });

    return {
        title: t("aboutTitle"),
        description: t("aboutDescription"),
        alternates: buildAlternates(locale, "/about"),
    };
}

export default async function AboutPage() {
    const t = await getTranslations("AboutPage");

    return (
        <main className="min-h-screen bg-background">
            <div className="lg:mx-16 m-4 md:m-8">
                <Header />
                <div className="py-12 md:py-24 max-w-4xl mx-auto space-y-8">
                    <h1 className="text-4xl md:text-6xl font-bold text-center">
                        {t("title")} <span className="text-primary">{t("titleHighlight")}</span>
                    </h1>
                    <p className="text-xl text-muted-foreground text-center leading-relaxed">
                        {t("description")}
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 mt-16">
                        <div className="bg-secondary/20 p-8 rounded-3xl">
                            <h3 className="text-2xl font-bold mb-4">{t("missionTitle")}</h3>
                            <p className="text-muted-foreground">
                                {t("missionDescription")}
                            </p>
                        </div>
                        <div className="bg-secondary/20 p-8 rounded-3xl">
                            <h3 className="text-2xl font-bold mb-4">{t("visionTitle")}</h3>
                            <p className="text-muted-foreground">
                                {t("visionDescription")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
