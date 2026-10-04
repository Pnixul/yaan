import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./shell.css";
import { AppNavigation } from "@/components/app-navigation";
import { THEME_BOOTSTRAP } from "@/lib/theme";

export const metadata: Metadata = {
  title: "YAAN — Get to know the neighbourhood",
  description:
    "Explore everyday places, journeys, and area context around a reference location. A map-first prototype using illustrative sample data.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script id="yaan-theme" dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="font-sans antialiased">
        <AppNavigation />
        {children}
      </body>
    </html>
  );
}
