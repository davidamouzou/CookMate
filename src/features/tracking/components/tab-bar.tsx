"use client";

import { BookOpen, Droplet, NotebookText, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const TABS = [
    { key: "today", href: "/", icon: NotebookText },
    { key: "water", href: "/water", icon: Droplet },
    { key: "program", href: "/program", icon: Target },
    { key: "recipes", href: "/recipes", icon: BookOpen },
] as const;

/**
 * Dark tab bar pinned to the bottom of the tracking product, as in the design.
 * The active tab takes a light pill; the others stay quiet.
 */
export function TabBar() {
    const t = useTranslations("Track");
    const pathname = usePathname();

    return (
        <nav
            className="sticky bottom-0 z-30 -mx-4 mt-4 rounded-t-3xl bg-surface-inverted px-3 py-2.5"
            aria-label={t("tabsLabel")}
        >
            <ul className="flex items-center justify-around gap-1">
                {TABS.map((tab) => {
                    // "/" would otherwise match every route.
                    const isActive = tab.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(tab.href);

                    return (
                        <li key={tab.key} className="flex-1">
                            <Link
                                href={tab.href}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "flex items-center justify-center gap-2 rounded-full px-3 py-2",
                                    "font-mono text-xs font-bold transition-colors",
                                    isActive
                                        ? "bg-surface-inverted-foreground text-surface-inverted"
                                        : "text-surface-inverted-foreground/60 hover:text-surface-inverted-foreground"
                                )}
                            >
                                <tab.icon className="h-4 w-4 shrink-0" aria-hidden />
                                <span className={cn(!isActive && "sr-only sm:not-sr-only")}>
                                    {t(`tabs.${tab.key}`)}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
