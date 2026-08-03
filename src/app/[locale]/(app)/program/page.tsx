import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { ProgramTracker } from "@/features/tracking/components/program-tracker";
import { buildAlternates } from "@/lib/metadata";
import { type Locale } from "@/i18n/routing";

type ProgramPageProps = {
    params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: ProgramPageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Program" });

    return {
        title: t("metaTitle"),
        description: t("metaDescription"),
        alternates: buildAlternates(locale, "/program"),
    };
}

export default async function ProgramPage({ params }: ProgramPageProps) {
    const { locale } = await params;
    return <ProgramTracker locale={locale} />;
}
