"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

/**
 * Shown when no session could be started. The cause is almost always a project
 * setting rather than a transient failure, so the notice names the fix and
 * offers a retry — no page reload needed once the setting is flipped.
 */
export function SessionNotice({ onRetry, isRetrying }: {
    onRetry: () => void;
    isRetrying: boolean;
}) {
    const t = useTranslations("Track");

    return (
        <div className="rounded-2xl border border-border/60 bg-surface-raised p-4">
            <p className="font-mono text-sm font-bold">{t("sessionErrorTitle")}</p>
            <p className="mt-1.5 font-mono text-xs leading-relaxed text-muted-foreground">
                {t("sessionError")}
            </p>
            <ol className="mt-3 list-inside list-decimal space-y-1 font-mono text-[0.6875rem] text-muted-foreground">
                <li>{t("sessionFixAuth")}</li>
                <li>{t("sessionFixSql")}</li>
            </ol>
            <Button
                type="button"
                variant="outline"
                onClick={onRetry}
                disabled={isRetrying}
                className="mt-4 gap-2 font-mono"
            >
                <RefreshCw className={isRetrying ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} aria-hidden />
                {t("retry")}
            </Button>
        </div>
    );
}
