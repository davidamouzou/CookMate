import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { buildAlternates } from "@/lib/metadata";
import { type Locale } from "@/i18n/routing";

type BlogPageProps = {
    params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Metadata" });

    return {
        title: t("blogTitle"),
        description: t("blogDescription"),
        alternates: buildAlternates(locale, "/blog"),
    };
}

export default async function BlogPage({ params }: BlogPageProps) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "BlogPage" });
    const formatDate = (date: string) =>
        new Intl.DateTimeFormat(locale, {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(new Date(date));

    const posts = [
        {
            id: 1,
            title: t("posts.healthyCooking.title"),
            excerpt: t("posts.healthyCooking.excerpt"),
            date: formatDate("2023-11-20"),
            category: t("posts.healthyCooking.category"),
            image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop"
        },
        {
            id: 2,
            title: t("posts.sourdough.title"),
            excerpt: t("posts.sourdough.excerpt"),
            date: formatDate("2023-11-18"),
            category: t("posts.sourdough.category"),
            image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop"
        },
        {
            id: 3,
            title: t("posts.weeknightDinners.title"),
            excerpt: t("posts.weeknightDinners.excerpt"),
            date: formatDate("2023-11-15"),
            category: t("posts.weeknightDinners.category"),
            image: "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=2070&auto=format&fit=crop"
        }
    ];

    return (
        <main className="min-h-screen bg-background">
            <div className="lg:mx-16 m-4 md:m-8">
                <Header />
                <div className="py-12 space-y-12">
                    <div className="text-center space-y-4">
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold">
                            {t("title")} <span className="text-primary">{t("titleHighlight")}</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            {t("description")}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <div key={post.id} className="group cursor-pointer space-y-4">
                                <div className="relative aspect-video rounded-2xl overflow-hidden bg-secondary/20">
                                    <img
                                        src={post.image}
                                        alt={post.title}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-medium text-primary uppercase tracking-wider">
                                        <span>{post.category}</span>
                                        <span>•</span>
                                        <span className="text-muted-foreground">{post.date}</span>
                                    </div>
                                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                                        {post.title}
                                    </h3>
                                    <p className="text-muted-foreground line-clamp-2">
                                        {post.excerpt}
                                    </p>
                                    <Button variant="link" className="p-0 h-auto font-semibold text-foreground group-hover:text-primary">
                                        {t("readMore")} →
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}
