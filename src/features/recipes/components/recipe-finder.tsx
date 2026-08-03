"use client";

import { useCallback, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import {
    Camera,
    Check,
    ExternalLink,
    Loader2,
    Search,
    Sparkles,
    Trash2,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { SectionCard } from "@/components/ui/section-card";
import chooseImage from "@/lib/choose-image";
import { RecipeProvider } from "@/features/recipes/api/recipe-provider";
import { useRecipes } from "@/features/recipes/context/recipe-context";
import type { FoundRecipe } from "@/features/recipes/lib/recipe-search";
import type { Recipe } from "@/features/recipes/types/recipe";
import { Link } from "@/i18n/routing";

/**
 * Searches the web for an existing recipe, rather than inventing one.
 *
 * Three ways in, combinable: a photo of what is in the fridge, a calorie
 * target and a protein floor. Results arrive with the page they were found on,
 * and only the one the visitor keeps gets illustrated and stored — generating
 * an image for every result would cost four generations per search.
 */
export function RecipeFinder() {
    const t = useTranslations("RecipeFinder");
    const locale = useLocale();
    const { addRecipe } = useRecipes();

    const [photo, setPhoto] = useState<string | null>(null);
    const [text, setText] = useState("");
    const [calories, setCalories] = useState("");
    const [protein, setProtein] = useState("");

    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<FoundRecipe[] | null>(null);
    const [detected, setDetected] = useState<string[]>([]);

    const hasCriteria = Boolean(photo || text.trim() || calories || protein);

    const handlePhoto = useCallback(async () => {
        try {
            const image = await chooseImage();
            if (image) {
                setPhoto(image);
                setError(null);
            }
        } catch {
            setError(t("photoError"));
        }
    }, [t]);

    const handleSearch = useCallback(async () => {
        if (!hasCriteria || searching) return;

        setSearching(true);
        setError(null);
        setResults(null);
        setDetected([]);

        const response = await RecipeProvider.findRecipes({
            text: text.trim() || undefined,
            image: photo ?? undefined,
            targetCalories: toNumber(calories),
            minProtein: toNumber(protein),
            language: locale,
        });

        setSearching(false);

        if (!response.success) {
            setError(response.code === "quota" ? t("quotaError") : response.message || t("searchError"));
            return;
        }

        setDetected(response.ingredients);
        setResults(response.recipes);
    }, [calories, hasCriteria, locale, photo, protein, searching, t, text]);

    const reset = () => {
        setPhoto(null);
        setText("");
        setCalories("");
        setProtein("");
        setResults(null);
        setDetected([]);
        setError(null);
    };

    return (
        <SectionCard
            title={
                <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-track-purple-ink" aria-hidden />
                    {t("title")}
                </span>
            }
            aside={t("poweredBy")}
        >
            <p className="mb-3 font-mono text-meta text-muted-foreground">{t("description")}</p>

            {/* Photo */}
            <div className="flex items-center gap-3">
                {photo ? (
                    <div className="relative shrink-0">
                        {/* A local data URL: next/image has nothing to optimise here. */}
                        <img
                            src={photo}
                            alt={t("photoAlt")}
                            className="h-16 w-16 rounded-xl border border-border/60 object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => setPhoto(null)}
                            aria-label={t("photoRemove")}
                            className="tap absolute -right-2 -top-2 rounded-full bg-surface-raised p-1 text-muted-foreground shadow-tile transition-colors hover:text-destructive"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ) : null}

                <Button
                    type="button"
                    variant="outline"
                    onClick={handlePhoto}
                    className="tap h-10 gap-2 rounded-full font-mono text-xs"
                >
                    <Camera className="h-4 w-4" />
                    {photo ? t("photoChange") : t("photoButton")}
                </Button>
            </div>

            {/* Nutrition targets */}
            <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="space-y-1">
                    <span className="font-mono text-meta text-muted-foreground">
                        {t("caloriesLabel")}
                    </span>
                    <Input
                        type="number"
                        inputMode="numeric"
                        min={50}
                        max={3000}
                        step={10}
                        value={calories}
                        onChange={(event) => setCalories(event.target.value)}
                        placeholder={t("caloriesPlaceholder")}
                        className="font-mono tabular"
                    />
                </label>

                <label className="space-y-1">
                    <span className="font-mono text-meta text-muted-foreground">
                        {t("proteinLabel")}
                    </span>
                    <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={300}
                        step={5}
                        value={protein}
                        onChange={(event) => setProtein(event.target.value)}
                        placeholder={t("proteinPlaceholder")}
                        className="font-mono tabular"
                    />
                </label>
            </div>

            <Input
                value={text}
                onChange={(event) => setText(event.target.value.slice(0, 200))}
                placeholder={t("textPlaceholder")}
                maxLength={200}
                className="mt-3"
                onKeyDown={(event) => {
                    if (event.key === "Enter") handleSearch();
                }}
            />

            <div className="mt-3 flex items-center gap-2">
                <Button
                    type="button"
                    onClick={handleSearch}
                    disabled={!hasCriteria || searching}
                    className="tap h-10 flex-1 gap-2 rounded-full font-mono text-xs"
                >
                    {searching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Search className="h-4 w-4" />
                    )}
                    {searching ? t("searching") : t("searchButton")}
                </Button>

                {results || detected.length > 0 || error ? (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={reset}
                        aria-label={t("reset")}
                        className="tap h-10 w-10 shrink-0 rounded-full p-0"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                ) : null}
            </div>

            {searching ? (
                <p className="mt-3 font-mono text-meta text-muted-foreground">{t("searchingHint")}</p>
            ) : null}

            {detected.length > 0 ? (
                <div className="mt-3 space-y-1.5">
                    <span className="font-mono text-meta text-muted-foreground">{t("detected")}</span>
                    <div className="flex flex-wrap gap-1.5">
                        {detected.map((ingredient) => (
                            <Pill key={ingredient} tone="green">
                                {ingredient}
                            </Pill>
                        ))}
                    </div>
                </div>
            ) : null}

            {error ? (
                <p className="mt-3 font-mono text-meta text-destructive" role="alert">
                    {error}
                </p>
            ) : null}

            {results?.length === 0 ? (
                <p className="mt-3 font-mono text-meta text-muted-foreground">{t("noResults")}</p>
            ) : null}

            <AnimatePresence>
                {results && results.length > 0 ? (
                    <motion.ul
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-4 space-y-3"
                    >
                        {results.map((recipe, index) => (
                            <ResultRow
                                key={recipe.source_url ?? `${recipe.recipe_name}-${index}`}
                                recipe={recipe}
                                locale={locale}
                                onSaved={addRecipe}
                            />
                        ))}
                    </motion.ul>
                ) : null}
            </AnimatePresence>
        </SectionCard>
    );
}

type ResultRowProps = {
    recipe: FoundRecipe;
    locale: string;
    onSaved: (recipe: Recipe) => void;
};

function ResultRow({ recipe, locale, onSaved }: ResultRowProps) {
    const t = useTranslations("RecipeFinder");
    const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
    const [savedId, setSavedId] = useState<string | null>(null);

    const handleSave = async () => {
        setState("saving");

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { match: _match, ...draft } = recipe;
        const { success, recipe: saved } = await RecipeProvider.publishRecipe(draft, locale);

        if (!success || !saved) {
            setState("error");
            return;
        }

        setSavedId(saved.id);
        setState("saved");
        onSaved(saved);
    };

    return (
        <li className="rounded-xl border border-border/60 bg-surface p-3">
            <h3 className="font-mono text-sm font-bold leading-tight">{recipe.recipe_name}</h3>

            {recipe.description ? (
                <p className="mt-1 line-clamp-2 font-mono text-meta text-muted-foreground">
                    {recipe.description}
                </p>
            ) : null}

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {recipe.match.calories !== null ? (
                    <Pill tone="orange">{t("kcal", { value: Math.round(recipe.match.calories) })}</Pill>
                ) : null}
                {recipe.match.protein !== null ? (
                    <Pill tone="purple">{t("protein", { value: Math.round(recipe.match.protein) })}</Pill>
                ) : null}
                {recipe.duration_to_cook > 0 ? (
                    <Pill tone="neutral">{t("minutes", { value: recipe.duration_to_cook })}</Pill>
                ) : null}
                {recipe.servings > 0 ? (
                    <Pill tone="neutral">{t("servings", { value: recipe.servings })}</Pill>
                ) : null}
            </div>

            {/* Provenance is the point of this feature, so it is always shown —
                including when the model could not produce a real source. */}
            <p className="mt-2 font-mono text-meta text-muted-foreground">
                {recipe.source_url ? (
                    <a
                        href={recipe.source_url}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
                    >
                        {t("source", { site: recipe.source_name ?? recipe.source_url })}
                        <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                ) : (
                    t("noSource")
                )}
            </p>

            <div className="mt-3 flex items-center gap-2">
                {state === "saved" && savedId ? (
                    <>
                        <Pill tone="green" icon={<Check className="h-3 w-3" />}>
                            {t("saved")}
                        </Pill>
                        <Link
                            href={`/recipes/${savedId}`}
                            className="tap font-mono text-meta underline underline-offset-2"
                        >
                            {t("viewRecipe")}
                        </Link>
                    </>
                ) : (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleSave}
                        disabled={state === "saving"}
                        className="tap h-8 gap-2 rounded-full font-mono text-meta"
                    >
                        {state === "saving" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        {state === "saving" ? t("savingRecipe") : t("saveRecipe")}
                    </Button>
                )}

                {state === "error" ? (
                    <span className="font-mono text-meta text-destructive">{t("saveError")}</span>
                ) : null}
            </div>
        </li>
    );
}

/** An empty field means "no target", which is not the same as 0. */
function toNumber(value: string): number | undefined {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
