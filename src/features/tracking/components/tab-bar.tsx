"use client";

import { BookOpen, Droplet, NotebookText, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppSettings } from "@/components/layout/app-settings";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const TABS = [
    { key: "today", href: "/", icon: NotebookText },
    { key: "water", href: "/water", icon: Droplet },
    { key: "program", href: "/program", icon: Target },
    { key: "recipes", href: "/recipes", icon: BookOpen },
] as const;

/**
 * The app's only chrome. One element in two shapes, so assistive technology
 * sees a single nav landmark either way: a dark bar pinned to the bottom on
 * phones and tablets, as in the design, and a full-height rail on the left from
 * `lg`, where the pointer is and the bottom edge of the screen is no longer the
 * easy target.
 *
 * It carries the brand and the settings entry as well as the four destinations,
 * which is what let the header go: a locale picker and a theme toggle are
 * set-once preferences, and they were costing a 56px bar above every screen.
 *
 * The active tab takes a light pill; the others stay quiet.
 */
export function TabBar() {
    const t = useTranslations("Track");
    const pathname = usePathname();

    return (
        <nav
            className={cn(
                "sticky bottom-0 z-30 -mx-4 mt-4 rounded-t-3xl bg-nav px-3 py-2.5",
                // A hairline separates the rail from the canvas in dark mode,
                // where nav and surface are only a step apart.
                "border border-transparent dark:border-border",
                // Phones sit on the home-indicator area; pad past it so the last
                // row of tabs stays tappable.
                "pb-[max(0.625rem,env(safe-area-inset-bottom))]",
                "sm:-mx-6 sm:px-5",
                // From lg: a rail, ordered first in the row but left after the
                // content in the DOM so the log still comes first when read.
                // It runs the height of the viewport rather than hugging four
                // items, so it reads as the edge of the app and not as a card
                // floating in the corner.
                "lg:order-first lg:mx-0 lg:mt-0 lg:w-52 lg:shrink-0",
                "lg:sticky lg:top-4 lg:bottom-auto lg:h-[calc(100vh-2rem)]",
                "lg:flex lg:flex-col lg:rounded-3xl lg:p-3 lg:pb-3",
                // Bureau: the rail widens with the shell.
                "desk:w-60 desk:p-4 desk:pb-4"
            )}
            aria-label={t("tabsLabel")}
        >
            {/* The brand only appears where the rail has room for it. On a phone
                the app does not need to tell you its name on every screen. */}
            <Link
                href="/"
                className="tap mb-4 hidden items-center gap-2 px-2 text-nav-foreground lg:flex"
            >
                <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg">
                    <img
                        src="/logo/light.png"
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                </span>
                <span className="font-mono text-base font-bold tracking-tight">
                    C<span className="text-track-orange">OOK</span>ER
                </span>
            </Link>

            <ul className="flex items-center justify-around gap-1 lg:flex-col lg:items-stretch lg:gap-1">
                {TABS.map((tab) => {
                    // "/" would otherwise match every route.
                    const isActive = tab.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(tab.href);

                    return (
                        <li key={tab.key} className="flex-1 lg:flex-none">
                            <Link
                                href={tab.href}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "tap flex items-center justify-center gap-2 rounded-full px-3 py-2",
                                    "font-mono text-xs font-bold transition-colors",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nav-foreground/70",
                                    "lg:justify-start lg:gap-2.5 lg:px-3.5 lg:py-2.5 lg:text-sm",
                                    isActive
                                        ? "bg-nav-active text-nav-active-foreground"
                                        : "text-nav-foreground/60 hover:text-nav-foreground"
                                )}
                            >
                                <tab.icon className="h-4 w-4 shrink-0" aria-hidden />
                                {/* Below sm there is no room for five labels, so
                                    only the active tab names itself. */}
                                <span className={cn(!isActive && "sr-only sm:not-sr-only")}>
                                    {t(`tabs.${tab.key}`)}
                                </span>
                            </Link>
                        </li>
                    );
                })}

                {/* Settings rides in the bar on a phone, and drops to the foot of
                    the rail on a pointer, away from the four destinations. */}
                <li className="flex-1 lg:hidden">
                    <AppSettings className="w-full" />
                </li>
            </ul>

            <div className="mt-auto hidden pt-4 lg:block">
                <AppSettings className="w-full justify-start px-3.5 py-2.5" />
            </div>
        </nav>
    );
}
