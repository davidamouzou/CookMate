import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { TodayTracker } from "@/features/tracking/components/today-tracker";
import { buildAlternates } from "@/lib/metadata";
import { type Locale } from "@/i18n/routing";

type TrackPageProps = {
    params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: TrackPageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Track" });

    return {
        title: t("metaTitle"),
        description: t("metaDescription"),
        alternates: buildAlternates(locale),
    };
}

export default async function TrackPage({ params }: TrackPageProps) {
    const { locale } = await params;
    return <TodayTracker locale={locale} />;
}
