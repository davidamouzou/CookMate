import Header from "@/components/layout/header";
//import { useTranslations } from "next-intl";

export default function AboutPage() {
    //const t = useTranslations('About'); // You might need to add this to your messages

    return (
        <main className="min-h-screen bg-background">
            <div className="lg:mx-16 m-4 md:m-8">
                <Header />
                <div className="py-12 md:py-24 max-w-4xl mx-auto space-y-8">
                    <h1 className="text-4xl md:text-6xl font-bold text-center">
                        About <span className="text-primary">Flavor</span>
                    </h1>
                    <p className="text-xl text-muted-foreground text-center leading-relaxed">
                        Flavor is your ultimate culinary companion, designed to inspire your daily cooking journey.
                        We believe that cooking should be accessible, fun, and delicious for everyone.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 mt-16">
                        <div className="bg-secondary/20 p-8 rounded-3xl">
                            <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                            <p className="text-muted-foreground">
                                To empower home cooks with creative recipes, smart tools, and a community that shares the love for food.
                            </p>
                        </div>
                        <div className="bg-secondary/20 p-8 rounded-3xl">
                            <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                            <p className="text-muted-foreground">
                                A world where every meal is an opportunity to explore new flavors and create lasting memories with loved ones.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
