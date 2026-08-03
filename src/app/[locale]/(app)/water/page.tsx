import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { WaterTracker } from "@/features/tracking/components/water-tracker";
import { buildAlternates } from "@/lib/metadata";
import { type Locale } from "@/i18n/routing";

type WaterPageProps = {
    params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: WaterPageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Water" });

    return {
        title: t("metaTitle"),
        description: t("metaDescription"),
        alternates: buildAlternates(locale, "/water"),
    };
}

export default async function WaterPage({ params }: WaterPageProps) {
    const { locale } = await params;
    return <WaterTracker locale={locale} />;
}
