import { Button } from "@/components/ui/button";
import Header from "@/components/widgets/header";
import Image from "next/image";

export default function BlogPage() {
    const posts = [
        {
            id: 1,
            title: "10 Tips for Healthy Cooking",
            excerpt: "Discover simple changes you can make to your cooking routine for a healthier lifestyle.",
            date: "Nov 20, 2023",
            category: "Health",
            image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop"
        },
        {
            id: 2,
            title: "The Art of Sourdough",
            excerpt: "A beginner's guide to making your own delicious sourdough bread at home.",
            date: "Nov 18, 2023",
            category: "Baking",
            image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop"
        },
        {
            id: 3,
            title: "Quick Weeknight Dinners",
            excerpt: "Save time without compromising on flavor with these 30-minute meal ideas.",
            date: "Nov 15, 2023",
            category: "Recipes",
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
                            Culinary <span className="text-primary">Blog</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Latest news, tips, and stories from the Flavoriz kitchen.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <div key={post.id} className="group cursor-pointer space-y-4">
                                <div className="relative aspect-video rounded-2xl overflow-hidden bg-secondary/20">
                                    <Image
                                        src={post.image}
                                        alt={post.title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
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
                                        Read More →
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
