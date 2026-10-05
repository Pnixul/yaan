import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";
import "./shell.css";
import { AppNavigation } from "@/components/app-navigation";
import { THEME_BOOTSTRAP } from "@/lib/theme";
import { LANGUAGE_BOOTSTRAP } from "@/lib/language";

const lineSeed = localFont({
  src: [
    { path: "./fonts/LINESeedSansTH_W_Rg.woff2", weight: "400", style: "normal" },
    { path: "./fonts/LINESeedSansTH_W_Bd.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-line-seed",
  display: "swap",
  fallback: ["Leelawadee UI", "Tahoma", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "YAAN — Get to know the neighbourhood",
  description:
    "Explore everyday places, journeys, and area context around a reference location. A map-first prototype using illustrative sample data.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <script
          id="yaan-theme"
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }}
        />
        <script
          id="yaan-language"
          dangerouslySetInnerHTML={{ __html: LANGUAGE_BOOTSTRAP }}
        />
      </head>
      <body className={`${lineSeed.variable} font-sans antialiased`}>
        <AppNavigation />
        {children}
      </body>
    </html>
  );
}
