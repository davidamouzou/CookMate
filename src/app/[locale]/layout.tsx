import "@/styles/globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Analytics } from "@vercel/analytics/react";
import { Metadata, Viewport } from "next";
import { Caveat, JetBrains_Mono, Outfit } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from "next/navigation";
import { buildAlternates, getBaseUrl } from "@/lib/metadata";
import { locales, type Locale } from "@/i18n/routing";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  variable: "--font-outfit",
});

// Carries the tracking UI: labels, figures and log rows.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
  variable: "--font-mono",
});

// Reserved for hand-lettered accents in headlines.
const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-display",
});

/**
 * `viewport-fit=cover` lets the layout reach under the notch and the home
 * indicator, which is what makes `env(safe-area-inset-*)` report anything —
 * the bottom tab bar pads itself with it.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Matches `--surface` in each theme, so the browser chrome blends with the
  // app shell rather than banding against it.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#efece6" },
    { media: "(prefers-color-scheme: dark)", color: "#14120f" },
  ],
};

type RootLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function isSupportedLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export async function generateMetadata({ params }: RootLayoutProps): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = isSupportedLocale(requestedLocale) ? requestedLocale : "en";
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    metadataBase: getBaseUrl(),
    applicationName: t("brand"),
    title: {
      default: t("siteTitle"),
      template: `%s | ${t("brand")}`,
    },
    description: t("siteDescription"),
    alternates: buildAlternates(locale),
  };
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="google-adsense-account" content="ca-pub-5222739966901829"></meta>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5222739966901829"
          crossOrigin="anonymous" />
      </head>
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} ${caveat.variable} font-sans`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme={'system'}
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
