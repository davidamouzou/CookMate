import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Header from "@/components/layout/header";
import { Globe, Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { buildAlternates } from "@/lib/metadata";
import { type Locale } from "@/i18n/routing";

type ContactPageProps = {
    params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Metadata" });

    return {
        title: t("contactTitle"),
        description: t("contactDescription"),
        alternates: buildAlternates(locale, "/contact"),
    };
}

export default async function ContactPage() {
    const t = await getTranslations("ContactPage");

    return (
        <main className="min-h-screen bg-background">
            <div className="lg:mx-16 m-4 md:m-8">
                <Header />
                <div className="py-12 md:py-24 grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">

                    <div className="space-y-8">
                        <h1 className="text-4xl md:text-6xl font-bold">
                            {t("title")} <span className="text-primary">{t("titleHighlight")}</span>
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            {t("description")}
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-full text-primary">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{t("emailTitle")}</h3>
                                    <p className="text-muted-foreground">davidamzou@gmail.com</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-full text-primary">
                                    <Globe className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{t("websiteTitle")}</h3>
                                    <p className="text-muted-foreground">
                                        <a href="https://davidko.vercel.app" target="_blank" rel="noopener noreferrer">{t("websiteLinkLabel")}</a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card border border-border/50 p-8 rounded-3xl shadow-sm">
                        <form className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("firstName")}</label>
                                    <Input placeholder={t("firstNamePlaceholder")} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{t("lastName")}</label>
                                    <Input placeholder={t("lastNamePlaceholder")} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t("email")}</label>
                                <Input type="email" placeholder={t("emailPlaceholder")} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t("message")}</label>
                                <Textarea placeholder={t("messagePlaceholder")} className="min-h-[150px]" />
                            </div>
                            <Button className="w-full rounded-full" size="lg">{t("submit")}</Button>
                        </form>
                    </div>

                </div>
            </div>
        </main>
    );
}
