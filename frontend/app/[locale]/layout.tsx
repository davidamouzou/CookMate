import "@/style/globals.css";
import "@/style/scroll-style.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Analytics } from "@vercel/analytics/react";
import React from "react";
import { Metadata } from "next";
import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Coooker",
  description: "Coooker is your go-to app for discovering, creating, and sharing delicious recipes. Explore a wide variety of dishes, manage your favorites, and get inspired to cook something new every day.",
}

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'fr' }];
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const { locale } = params;
  console.log('RootLayout locale:', locale);
  let messages;
  try {
    messages = await getMessages({ locale });
    console.log('RootLayout messages loaded');
  } catch (error) {
    console.error('RootLayout messages error:', error);
    messages = {}; // Fallback
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head ><title>Generate</title></head>
      <body
        className={`${outfit.className}`}
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
