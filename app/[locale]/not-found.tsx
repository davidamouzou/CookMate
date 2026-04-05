import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function NotFound() {
    const t = await getTranslations("NotFound");

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
            <h2 className="text-3xl font-bold">{t("title")}</h2>
            <p className="max-w-md text-muted-foreground">{t("description")}</p>
            <Link href="/" className="text-primary hover:underline">{t("cta")}</Link>
        </div>
    )
}
