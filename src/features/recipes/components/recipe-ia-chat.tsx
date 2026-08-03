"use client";

import React, { useCallback, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SlidersHorizontal, WandSparkles, X, Send, Image as ImageIcon, Loader2 } from "lucide-react";
import chooseImage from "@/lib/choose-image";
import { Recipe } from "@/features/recipes/types/recipe";
import { RecipeProvider } from "@/features/recipes/api/recipe-provider";
import RecipeCard from "./recipe-card";
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    recipe?: Recipe | null;
    image?: string;
    isLoading?: boolean;
}

const RecipeIAChat: React.FC = () => {
    const t = useTranslations("RecipeIAChat");
    const locale = useLocale();
    // Chat State
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>(() => [
        {
            id: 'welcome',
            role: 'assistant',
            content: t("welcome")
        }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Filter State
    const [mealType, setMealType] = useState("");
    const [cookTime, setCookTime] = useState([30]);
    const [level, setLevel] = useState("");
    const [language, setLanguage] = useState(locale);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    useEffect(() => {
        setLanguage(locale);
    }, [locale]);

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
            mealType ? `${t("filters.mealType")}: ${t(`mealTypeOptions.${mealType}`)}` : '',
            `durée <= ${cookTime[0]} minutes`,
            level ? `${t("filters.difficulty")}: ${t(`difficultyOptions.${level}`)}` : '',
        ].filter(Boolean).join(", ");

        const newUserMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userMessageText || t("defaultPrompt")
        };

        setMessages(prev => [...prev, newUserMessage]);
        setIsGenerating(true);

        // Add a temporary loading message
        const loadingId = 'loading-' + Date.now();
        setMessages(prev => [...prev, {
            id: loadingId,
            role: 'assistant',
            content: t("thinking"),
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
                        content: t("invalidRecipe")
                    }]);
                    return;
                }

                // Generate and upload image
                try {
                    const imageUrl = await RecipeProvider.generateImage(res.recipe.description ?? "");
                    res.recipe.image = imageUrl || "";
                    const recipeSave = await saveRecipesHandler(res.recipe);
                    if (recipeSave) {
                        setMessages(prev => [...prev, {
                            id: Date.now().toString(),
                            role: 'assistant',
                            content: t("recipeReady", { name: res.recipe?.recipe_name ?? "" }),
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
                    content: res.message || t("generationError")
                }]);
            }
        } catch (error) {
            console.error("Recipe generation failed", error);
            setMessages(prev => prev.filter(m => m.id !== loadingId));
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: t("technicalError")
            }]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleImageUpload = async () => {
        try {
            const image = await chooseImage();
            if (image) {
                const userMessageId = Date.now().toString();
                setMessages(prev => [...prev, {
                    id: userMessageId,
                    role: 'user',
                    content: t("imageUploaded"),
                    image,
                }]);

                const loadingId = 'loading-image-' + Date.now();
                setMessages(prev => [...prev, {
                    id: loadingId,
                    role: 'assistant',
                    content: t("imageAnalyzing"),
                    isLoading: true
                }]);
                setIsGenerating(true);

                const res = await RecipeProvider.generateRecipeFromImage(image, language);

                if (res.success && res.recipe) {
                    try {
                        // Optionally generate and upload a refined image based on the description
                        const imageUrl = await RecipeProvider.generateImage(res.recipe.description ?? "");
                        res.recipe.image = imageUrl || res.recipe.image || "";

                        const saved = await saveRecipesHandler(res.recipe);
                        if (saved) {
                            setMessages(prev => [...prev.filter(m => m.id !== loadingId), {
                                id: Date.now().toString(),
                                role: 'assistant',
                                content: t("imageDetected", { name: saved.recipe_name }),
                                recipe: saved,
                            }]);
                        } else {
                            setMessages(prev => [...prev.filter(m => m.id !== loadingId), {
                                id: Date.now().toString(),
                                role: 'assistant',
                                content: t("imageRecipe", { name: res.recipe!.recipe_name }),
                                recipe: res.recipe,
                            }]);
                        }
                    } catch (imgErr) {
                        console.error("Image refinement failed", imgErr);
                        setMessages(prev => [...prev.filter(m => m.id !== loadingId), {
                            id: Date.now().toString(),
                            role: 'assistant',
                            content: t("imageRecipe", { name: res.recipe!.recipe_name }),
                            recipe: res.recipe,
                        }]);
                    }
                } else {
                    setMessages(prev => [...prev.filter(m => m.id !== loadingId), {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: res.message || t("imageRecipeError")
                    }]);
                }
            }
        } catch (e) {
            console.error(e);
            toast.error(t("imageUploadError"));
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <Toaster richColors position="top-right" />
            {/* Floating Toggle Button */}
            {/* Sits above the bottom tab bar until lg turns navigation into a
                left rail and frees the bottom-right corner. */}
            <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+5rem)] right-4 z-50 flex flex-col items-end gap-3 pointer-events-none lg:bottom-6 lg:right-6 lg:gap-4">
                <AnimatePresence>
                    {!isOpen && (
                        <>
                            {/* Tooltip/Call to action bubble */}
                            <motion.div
                                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                                transition={{ delay: 1, type: "spring" }}
                                className="pointer-events-auto relative mr-2 hidden rounded-2xl border border-primary/10 bg-white px-4 py-2 shadow-xl xs:block dark:bg-zinc-800"
                            >
                                <div className="text-sm font-medium text-foreground">
                                    {t("cta")} 👨‍🍳
                                </div>
                                <div className="absolute -bottom-1 right-6 w-3 h-3 bg-white dark:bg-zinc-800 border-b border-r border-primary/10 transform rotate-45 translate-y-1/2"></div>
                            </motion.div>

                            <motion.button
                                type="button"
                                onClick={() => setIsOpen(true)}
                                aria-label={t("assistantTitle")}
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

                                <span
                                    className="relative z-10 block h-16 w-16 overflow-hidden rounded-full border-4 bg-white shadow-lg xs:h-[70px] xs:w-[70px] dark:bg-zinc-900"
                                >
                                    <img
                                        src="/images/Beagle_Fast_Food.gif"
                                        alt={t("assistantTitle")}
                                        width={80}
                                        height={80}
                                    />
                                </span>
                            </motion.button>
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
                        className="fixed bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] right-3 left-3 z-50 h-[600px] max-h-[calc(100vh-11rem)] flex flex-col bg-background/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl overflow-hidden sm:left-auto sm:w-[450px] lg:bottom-6 lg:right-6 lg:max-h-[80vh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <WandSparkles className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">{t("assistantTitle")}</h3>
                                    <p className="text-xs text-muted-foreground">{t("assistantSubtitle")}</p>
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
                                                <img
                                                    src={msg.image}
                                                    alt={t("imageUploaded")}
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
                                        <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-full" title={t("filtersButton")}>
                                            <SlidersHorizontal className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[calc(100vw-2rem)] max-w-80 p-4" align="start" side="top">
                                        <div className="space-y-4">
                                            <h4 className="font-medium leading-none mb-2">{t("preferences")}</h4>
                                            <div className="space-y-2">
                                                <Label>{t("mealType")}</Label>
                                                <Select value={mealType} onValueChange={setMealType}>
                                                    <SelectTrigger><SelectValue placeholder={t("all")} /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="breakfast">{t("mealTypeOptions.breakfast")}</SelectItem>
                                                        <SelectItem value="lunch">{t("mealTypeOptions.lunch")}</SelectItem>
                                                        <SelectItem value="dinner">{t("mealTypeOptions.dinner")}</SelectItem>
                                                        <SelectItem value="dessert">{t("mealTypeOptions.dessert")}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t("maxTime", { minutes: cookTime[0] })}</Label>
                                                <Slider value={cookTime} onValueChange={setCookTime} max={180} step={5} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t("difficulty")}</Label>
                                                <Select value={level} onValueChange={setLevel}>
                                                    <SelectTrigger><SelectValue placeholder={t("all")} /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="easy">{t("difficultyOptions.easy")}</SelectItem>
                                                        <SelectItem value="medium">{t("difficultyOptions.medium")}</SelectItem>
                                                        <SelectItem value="hard">{t("difficultyOptions.hard")}</SelectItem>
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
                                    <Textarea
                                        value={inputValue}
                                        onChange={(e) => {
                                            const value = e.target.value.slice(0, 300);
                                            setInputValue(value);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder={t("inputPlaceholder")}
                                        className="pr-10 py-3 px-4 rounded-3xl bg-muted/30 border-transparent focus:border-primary/20 focus:bg-background transition-all resize-none min-h-[48px] max-h-[120px] overflow-y-auto"
                                        disabled={isGenerating}
                                        maxLength={300}
                                        rows={1}
                                        style={{
                                            lineHeight: '1.5rem',
                                        }}
                                    />
                                    <div className="absolute bottom-2 right-3 text-xs text-muted-foreground">
                                        {inputValue.length}/300
                                    </div>
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
