"use client";

import { Monitor, Moon, Settings2, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import LanguageSelector from "@/components/layout/language-selector";
import { cn } from "@/lib/utils";

/**
 * Everything the app header used to hold — locale and theme — behind one
 * control in the navigation.
 *
 * These are set-once preferences, not per-screen actions: they were costing a
 * 56px bar on every screen, above every page title, to be touched roughly
 * never. Here they cost one slot in a bar that already exists.
 */
const THEMES = [
    { key: "light", icon: Sun },
    { key: "dark", icon: Moon },
    { key: "system", icon: Monitor },
] as const;

function ThemeChoice() {
    const { theme, setTheme } = useTheme();
    const t = useTranslations("Settings");

    // `theme` is unknown until the client reads storage; rendering the selected
    // state before then would mismatch the server markup.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <div
            role="radiogroup"
            aria-label={t("theme")}
            className="flex gap-1 rounded-xl bg-surface-sunken p-1"
        >
            {THEMES.map((option) => {
                const isActive = mounted && theme === option.key;

                return (
                    <button
                        key={option.key}
                        type="button"
                        role="radio"
                        aria-checked={isActive}
                        onClick={() => setTheme(option.key)}
                        className={cn(
                            "tap flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2",
                            "font-mono text-meta font-bold transition-colors",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isActive
                                ? "bg-surface-raised text-foreground shadow-tile"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <option.icon className="h-4 w-4 shrink-0" aria-hidden />
                        {t(`themes.${option.key}`)}
                    </button>
                );
            })}
        </div>
    );
}

export function AppSettings({ className }: { className?: string }) {
    const t = useTranslations("Settings");

    return (
        <Sheet>
            <SheetTrigger asChild>
                <button
                    type="button"
                    aria-label={t("title")}
                    className={cn(
                        "tap flex items-center justify-center gap-2 rounded-full px-3 py-2",
                        "font-mono text-xs font-bold transition-colors",
                        "text-nav-foreground/60 hover:text-nav-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-foreground/70",
                        className
                    )}
                >
                    <Settings2 className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="sr-only lg:not-sr-only lg:text-sm">{t("title")}</span>
                </button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full max-w-sm sm:max-w-md">
                <SheetHeader>
                    <SheetTitle className="font-mono">{t("title")}</SheetTitle>
                </SheetHeader>

                <div className="mt-8 flex flex-col gap-6">
                    <section>
                        <h3 className="mb-2 font-mono text-label uppercase tracking-wide text-muted-foreground">
                            {t("theme")}
                        </h3>
                        <ThemeChoice />
                    </section>

                    <section>
                        <h3 className="mb-2 font-mono text-label uppercase tracking-wide text-muted-foreground">
                            {t("language")}
                        </h3>
                        <LanguageSelector className="w-full" />
                    </section>
                </div>
            </SheetContent>
        </Sheet>
    );
}
