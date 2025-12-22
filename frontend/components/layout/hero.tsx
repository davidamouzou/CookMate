"use client";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
    Utensils,
    Soup,
    Salad,
    Carrot,
    Cake,
    Heart,
    Zap,
    ChefHat
} from "lucide-react";

export function Hero() {
    const t = useTranslations('Hero');

    const categories = [
        { name: 'All Types', icon: Utensils, active: true },
        { name: 'Appetizers', icon: Soup, active: false },
        { name: 'Main Courses', icon: ChefHat, active: false },
        { name: 'Salads & Sides', icon: Salad, active: false },
        { name: 'Vegetarian', icon: Carrot, active: false },
        { name: 'Desserts', icon: Cake, active: false },
        { name: 'Healthy Eats', icon: Heart, active: false },
        { name: 'Quick & Easy', icon: Zap, active: false },
    ];

    return (
        <div className="lg:w-1/2 w-full flex flex-col justify-center space-y-8 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <h2 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight text-foreground">
                    Explore <br />
                    <span className="text-primary">Culinary</span> Insights
                </h2>
                <p className="mt-6 text-lg text-muted-foreground max-w-md leading-relaxed">
                    {t('description')}
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-4"
            >
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                    What to <span className="text-primary">Cook</span>?
                </h3>

                <div className="flex flex-wrap gap-3">
                    {categories.map((cat, index) => (
                        <motion.button
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.location.href = '/recipes'}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${cat.active
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                                : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary hover:text-primary'
                                }`}
                        >
                            <cat.icon className="w-4 h-4" />
                            {cat.name}
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
