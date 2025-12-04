"use client";

import React, { useCallback, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal, WandSparkles, X, Send, Image as ImageIcon, Loader2 } from "lucide-react";
import chooseImage from "@/api/functions/choose_image";
import { Recipe } from "@/api/entities/recipe";
import { RecipeProvider } from "@/api/provider/recipe_provider";
import RecipeCard from "./recipe_card";
import { toast, Toaster } from "sonner";
import { uploadUrlImage } from "@/api/functions/upload_file";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    recipe?: Recipe | null;
    image?: string;
    isLoading?: boolean;
}

const RecipeIAChat: React.FC = () => {
    // Chat State
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Bonjour ! Je suis votre chef IA personnel. Dites-moi ce que vous avez dans votre frigo ou ce dont vous avez envie, et je créerai une recette pour vous !"
        }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Filter State
    const [mealType, setMealType] = useState("");
    const [cookTime, setCookTime] = useState([30]);
    const [level, setLevel] = useState("");
    const [language, setLanguage] = useState("fr");

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    // Detect language
    useEffect(() => {
        if (typeof window !== "undefined" && window.navigator && window.navigator.language) {
            const lang = window.navigator.language.slice(0, 2);
            if (["fr", "en", "es", "de"].includes(lang)) {
                setLanguage(lang);
            }
        }
    }, []);

    const saveRecipesHandler = useCallback(async (recipeToSave: Recipe): Promise<Recipe | null> => {
        try {
            const { success, recipe } = await RecipeProvider.saveRecipe(recipeToSave);
            if (success) {
                return recipe;
            }
            return null;
        } catch (error) {
            console.error("Error saving recipes:", error);
            return null;
        }
    }, []);

    const handleSendMessage = async () => {
        if (!inputValue.trim() && !mealType && !level) return;

        const userMessageText = inputValue;
        setInputValue("");

        // Construct the full prompt including filters
        const descriptionParts = [
            userMessageText,
            mealType ? `type de repas: ${mealType}` : '',
            `durée <= ${cookTime[0]} minutes`,
            level ? `niveau: ${level}` : '',
        ].filter(Boolean).join(", ");

        const newUserMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userMessageText || "Génère une recette avec mes filtres."
        };

        setMessages(prev => [...prev, newUserMessage]);
        setIsGenerating(true);

        // Add a temporary loading message
        const loadingId = 'loading-' + Date.now();
        setMessages(prev => [...prev, {
            id: loadingId,
            role: 'assistant',
            content: "Je réfléchis à une délicieuse recette...",
            isLoading: true
        }]);

        try {
            const res = await RecipeProvider.generateRecipe(descriptionParts, language);

            if (res.success && res.recipe) {
                const recipeGenerate = res.recipe;

                // Basic validation
                if (recipeGenerate.description === "" && !recipeGenerate.ingredients && !recipeGenerate.instructions) {
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: "Désolé, je n'ai pas pu générer une recette valide avec ces critères. Essayez d'être plus précis."
                    }]);
                    return;
                }

                // Generate and upload image
                try {
                    const imageGenerate = await RecipeProvider.generateImage(res.recipe.description ?? "");
                    const imageUpload = await uploadUrlImage(imageGenerate ?? "");
                    res.recipe.image = imageUpload || "";
                    const recipeSave = await saveRecipesHandler(res.recipe);
                    if (recipeSave) {
                        setMessages(prev => [...prev, {
                            id: Date.now().toString(),
                            role: 'assistant',
                            content: `Voici une recette pour vous : ${res.recipe?.recipe_name}`,
                            recipe: recipeSave,
                        }]);
                    }
                } catch (imgError) {
                    console.error("Image generation failed", imgError);
                    // Continue without image or with default
                }

                // Remove loading message
                setMessages(prev => prev.filter(m => m.id !== loadingId));

            } else {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: res.message || "Une erreur est survenue lors de la génération."
                }]);
            }
        } catch (error) {
            setMessages(prev => prev.filter(m => m.id !== loadingId));
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Désolé, une erreur technique est survenue."
            }]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleImageUpload = async () => {
        try {
            const image = await chooseImage();
            if (image) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'user',
                    content: "J'ai une image de mes ingrédients !",
                    image: image
                }]);

                // TODO: Send image to backend when API is ready
                // For now, we just acknowledge it
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: "Superbe image ! Pour l'instant, je ne peux pas encore analyser les images, mais je garde ça au chaud pour une prochaine mise à jour !"
                    }]);
                }, 1000);
            }
        } catch (e) {
            console.error(e);
            toast.error("Erreur lors du chargement de l'image");
        }
    };

    return (
        <>
            <Toaster richColors position="top-right" />
            {/* Floating Toggle Button */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
                <AnimatePresence>
                    {!isOpen && (
                        <>
                            {/* Tooltip/Call to action bubble */}
                            <motion.div
                                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                                transition={{ delay: 1, type: "spring" }}
                                className="bg-white dark:bg-zinc-800 px-4 py-2 rounded-2xl shadow-xl border border-primary/10 pointer-events-auto relative mr-2"
                            >
                                <div className="text-sm font-medium text-foreground">
                                    Besoin d'inspiration ? 👨‍🍳
                                </div>
                                <div className="absolute -bottom-1 right-6 w-3 h-3 bg-white dark:bg-zinc-800 border-b border-r border-primary/10 transform rotate-45 translate-y-1/2"></div>
                            </motion.div>

                            <motion.div
                                className="relative pointer-events-auto group"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                {/* Pulse rings */}
                                <motion.div
                                    className="absolute -inset-4 bg-primary/30 rounded-full z-0"
                                    animate={{
                                        scale: [1, 1.5],
                                        opacity: [0.5, 0],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeOut"
                                    }}
                                />
                                <motion.div
                                    onClick={() => setIsOpen(true)}
                                    className="absolute -inset-4 bg-primary/20 rounded-full z-0"
                                    animate={{
                                        scale: [1, 1.5],
                                        opacity: [0.5, 0],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeOut",
                                        delay: 1
                                    }}
                                />

                                <div
                                    className="rounded-full shadow-lg border-4 bg-white dark:bg-zinc-900 overflow-hidden w-[70px] h-[70px]"

                                >
                                    <Image
                                        src="/images/Beagle_Fast_Food.gif"
                                        alt="Chef Assistant"
                                        width={80}
                                        height={80}
                                    />
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-6 right-6 z-50 w-[90vw] sm:w-[450px] h-[600px] max-h-[80vh] flex flex-col bg-background/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <WandSparkles className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">Chef Assistant</h3>
                                    <p className="text-xs text-muted-foreground">Toujours prêt à cuisiner</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end flex flex-col' : 'items-start flex flex-col'}`}>
                                        {msg.image && (
                                            <div className="rounded-xl overflow-hidden border border-border/50 shadow-sm mb-1 max-w-[200px]">
                                                <Image
                                                    src={msg.image}
                                                    alt="User uploaded"
                                                    width={200}
                                                    height={200}
                                                    className="w-full h-auto object-cover"
                                                />
                                            </div>
                                        )}

                                        <div
                                            className={`p-3 rounded-2xl text-sm ${msg.role === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                : 'bg-muted/50 border border-border/50 rounded-tl-sm'
                                                }`}
                                        >
                                            {msg.isLoading ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    <span>{msg.content}</span>
                                                </div>
                                            ) : (
                                                msg.content
                                            )}
                                        </div>
                                        {msg.recipe && (
                                            <div className="w-full sm:w-72 mt-2">
                                                <RecipeCard recipe={msg.recipe} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-background/50 border-t border-border/50">
                            <div className="flex items-end gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-full" title="Filtres">
                                            <SlidersHorizontal className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-4" align="start" side="top">
                                        <div className="space-y-4">
                                            <h4 className="font-medium leading-none mb-2">Préférences</h4>
                                            <div className="space-y-2">
                                                <Label>Type de repas</Label>
                                                <Select value={mealType} onValueChange={setMealType}>
                                                    <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="breakfast">Petit déjeuner</SelectItem>
                                                        <SelectItem value="lunch">Déjeuner</SelectItem>
                                                        <SelectItem value="dinner">Dîner</SelectItem>
                                                        <SelectItem value="dessert">Dessert</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Temps max: {cookTime[0]} min</Label>
                                                <Slider value={cookTime} onValueChange={setCookTime} max={180} step={5} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Difficulté</Label>
                                                <Select value={level} onValueChange={setLevel}>
                                                    <SelectTrigger><SelectValue placeholder="Toutes" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="easy">Facile</SelectItem>
                                                        <SelectItem value="medium">Moyen</SelectItem>
                                                        <SelectItem value="hard">Difficile</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full" onClick={handleImageUpload}>
                                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                </Button>

                                <div className="relative flex-1">
                                    <Input
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                        placeholder="Une idée de recette ?"
                                        className="pr-10 py-6 rounded-full bg-muted/30 border-transparent focus:border-primary/20 focus:bg-background transition-all"
                                        disabled={isGenerating}
                                    />
                                </div>

                                <Button
                                    onClick={handleSendMessage}
                                    disabled={(!inputValue.trim() && !mealType) || isGenerating}
                                    size="icon"
                                    className="h-10 w-10 shrink-0 rounded-full bg-primary hover:bg-primary/90 transition-all"
                                >
                                    {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default RecipeIAChat;