"use client";

import Image from "next/image";
import { Button } from "../ui/button";
import { useTheme } from "next-themes";
import { Sun, Moon, Search, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "../ui/sheet";
import LanguageSelector from "./language-selector";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { motion } from "framer-motion";
import React from "react";

const Header = () => {
  const { setTheme } = useTheme();
  const t = useTranslations('Header');
  const router = useRouter();

  const navLinks = [
    { key: 'home', href: '/' },
    { key: 'about', href: '/about' },
    { key: 'recipes', href: '/recipes' },
    { key: 'blog', href: '/blog' },
    { key: 'contact', href: '/contact' },
  ];

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      router.push('/recipes');
    }
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 flex justify-between items-center bg-background/80 backdrop-blur-md border-b border-border/40 h-16 px-5 md:px-8 lg:px-12"
    >
      {/* Logo Section */}
      <Link href="/" className="flex items-center" aria-label={t('brandLabel')}>
        <div className="relative overflow-hidden rounded-lg w-8 h-8">
          <Image src="/logo/dark.png" alt={t('brandLabel')} fill className="object-cover dark:hidden" />
          <Image src="/logo/light.png" alt={t('brandLabel')} fill className="object-cover hidden dark:block" />
        </div>
        <span className="text-2xl md:block hidden font-bold tracking-tight">
          C<span className="text-primary">OOK</span>ER
        </span>
      </Link>

      {/* Navigation Links (Centered) */}
      <nav className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.key}
            href={link.href}
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors uppercase tracking-wide"
          >
            {t(`nav.${link.key}`)}
          </Link>
        ))}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Search Bar (Visual Only for now) */}
        <div className="hidden lg:flex items-center bg-secondary/50 rounded-full px-4 py-1.5 border border-transparent focus-within:border-primary/50 transition-all">
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            onKeyDown={handleSearch}
            className="bg-transparent border-none outline-none text-sm w-32 focus:w-48 transition-all placeholder:text-muted-foreground/70"
          />
          <Search className="w-4 h-4 text-muted-foreground" />
        </div>

        <LanguageSelector />

        <Button
          onClick={() => setTheme(theme => theme === "dark" ? "light" : "dark")}
          variant="ghost" size="icon" className="rounded-full"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t('toggleTheme')}</span>
        </Button>

        

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">{t('openMenu')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>{t('menuTitle')}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-6 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.key}
                    href={link.href}
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {t(`nav.${link.key}`)}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
