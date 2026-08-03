"use client";

import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import LanguageSelector from "@/components/layout/language-selector";
import { Link } from "@/i18n/routing";

/**
 * Slim header for the app: brand, locale, theme, and a menu holding the
 * secondary pages. Primary navigation lives in the bottom tab bar, so nothing
 * competes with it up here.
 */
const SECONDARY_LINKS = [
    { key: "about", href: "/about" },
    { key: "blog", href: "/blog" },
    { key: "contact", href: "/contact" },
] as const;

export default function AppHeader() {
    const { setTheme } = useTheme();
    const t = useTranslations("Header");

    return (
        <header className="sticky top-0 z-40 border-b border-border/50 bg-surface/85 backdrop-blur-md">
            <div className="mx-auto flex h-14 max-w-md items-center justify-between gap-2 px-4">
                <Link href="/" className="flex items-center gap-2" aria-label={t("brandLabel")}>
                    <span className="relative h-7 w-7 overflow-hidden rounded-lg">
                        <img
                            src="/logo/dark.png"
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover dark:hidden"
                        />
                        <img
                            src="/logo/light.png"
                            alt=""
                            className="absolute inset-0 hidden h-full w-full object-cover dark:block"
                        />
                    </span>
                    <span className="font-mono text-base font-bold tracking-tight">
                        C<span className="text-track-orange">OOK</span>ER
                    </span>
                </Link>

                <div className="flex items-center gap-1">
                    <LanguageSelector />

                    <Button
                        onClick={() => setTheme((theme) => (theme === "dark" ? "light" : "dark"))}
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                    >
                        <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">{t("toggleTheme")}</span>
                    </Button>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">{t("openMenu")}</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right">
                            <SheetHeader>
                                <SheetTitle className="font-mono">{t("menuTitle")}</SheetTitle>
                            </SheetHeader>
                            <nav className="mt-8 flex flex-col gap-5">
                                {SECONDARY_LINKS.map((link) => (
                                    <Link
                                        key={link.key}
                                        href={link.href}
                                        className="font-mono text-base font-bold transition-colors hover:text-track-orange"
                                    >
                                        {t(`nav.${link.key}`)}
                                    </Link>
                                ))}
                            </nav>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
