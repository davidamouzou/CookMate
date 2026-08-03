"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { TrackingProvider } from "@/features/tracking/api/tracking-provider";
import type { ParsedMeal } from "@/features/tracking/types/entry";

type AddEntryProps = {
    locale: string;
    open: boolean;
    onClose: () => void;
    onAdd: (meal: ParsedMeal) => Promise<void>;
};

/**
 * The AI composer sheet: a dark panel over the log where the user describes a
 * meal in plain language and gets its macros back before it is logged.
 */
export function AddEntry({ locale, open, onClose, onAdd }: AddEntryProps) {
    const t = useTranslations("Track");
    const [description, setDescription] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastMeal, setLastMeal] = useState<ParsedMeal | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    if (!open) return null;

    const submit = async () => {
        const trimmed = description.trim();
        if (!trimmed || isPending) return;

        setIsPending(true);
        setError(null);

        const meal = await TrackingProvider.parseMeal(trimmed, locale);

        if (!meal) {
            setError(t("parseError"));
            setIsPending(false);
            return;
        }

        setLastMeal(meal);
        await onAdd(meal);
        setDescription("");
        setIsPending(false);
    };

    return (
        <div className="sticky bottom-2 z-40">
            <div className="rounded-2xl bg-surface-inverted p-4 text-surface-inverted-foreground shadow-lifted">
                <div className="mb-3 flex items-start justify-between gap-3">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 opacity-70" aria-hidden />
                    <p className="flex-1 text-right font-mono text-xs leading-snug opacity-90">
                        {lastMeal ? lastMeal.title : t("composerHint")}
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t("closeComposer")}
                        className="rounded-full p-1 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                    >
                        <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                </div>

                {lastMeal ? (
                    <p className="mb-3 font-mono text-[0.6875rem] leading-snug opacity-60 tabular">
                        <span className="opacity-100">{lastMeal.kcal}</span> {t("kcalsUnit")}{" "}
                        <span className="opacity-100">{Math.round(lastMeal.carbsG)}g</span>{" "}
                        {t("carbsUnit")}{" "}
                        <span className="opacity-100">{Math.round(lastMeal.fatG)}g</span>{" "}
                        {t("fatUnit")}{" "}
                        <span className="opacity-100">{Math.round(lastMeal.proteinG)}g</span>{" "}
                        {t("proteinUnit")}
                    </p>
                ) : null}

                {error ? (
                    <p className="mb-3 font-mono text-[0.6875rem] text-track-coral" role="alert">
                        {error}
                    </p>
                ) : null}

                <div className="flex items-end gap-2 border-t border-white/10 pt-3">
                    <textarea
                        ref={inputRef}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder={t("inputPlaceholder")}
                        rows={1}
                        className={cn(
                            "flex-1 resize-none bg-transparent font-mono text-sm",
                            "placeholder:opacity-40 focus:outline-none"
                        )}
                        onKeyDown={(event) => {
                            // Enter submits; Shift+Enter keeps the newline.
                            if (event.key === "Enter" && !event.shiftKey) {
                                event.preventDefault();
                                void submit();
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={() => void submit()}
                        disabled={isPending || description.trim().length === 0}
                        aria-label={t("addMeal")}
                        className={cn(
                            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            "bg-surface-inverted-foreground text-surface-inverted",
                            "transition-opacity hover:opacity-90 disabled:opacity-30",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                        )}
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                            <Check className="h-4 w-4" aria-hidden />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
