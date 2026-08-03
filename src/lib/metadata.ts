import {locales, type Locale} from "@/i18n/routing";
import type {Metadata} from "next";

const fallbackBaseUrl = "https://coooke.fr";

export function getBaseUrl() {
  const configuredBaseUrl = process.env.BASE_URL?.trim();

  if (configuredBaseUrl) {
    try {
      return new URL(configuredBaseUrl);
    } catch {
      try {
        return new URL(`https://${configuredBaseUrl}`);
      } catch {
        // Fall back to a known-good absolute URL when BASE_URL is malformed.
      }
    }
  }

  return new URL(fallbackBaseUrl);
}

function normalizePath(pathname: string) {
  if (!pathname || pathname === "/") {
    return "";
  }

  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function buildAlternates(locale: Locale, pathname = ""): Metadata["alternates"] {
  const normalizedPath = normalizePath(pathname);

  return {
    canonical: `/${locale}${normalizedPath}`,
    languages: Object.fromEntries(
      locales.map((supportedLocale) => [
        supportedLocale,
        `/${supportedLocale}${normalizedPath}`,
      ])
    ),
  };
}
