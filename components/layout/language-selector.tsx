"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useTransition } from "react";

export default function LanguageSelector() {
    const locale = useLocale();
    const t = useTranslations("LanguageSelector");
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const handleValueChange = (nextLocale: string) => {
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <Select
            value={locale}
            onValueChange={handleValueChange}
            disabled={isPending}
        >
            <SelectTrigger className="w-[100px]">
                <SelectValue placeholder={t("label")} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
            </SelectContent>
        </Select>
    );
}
