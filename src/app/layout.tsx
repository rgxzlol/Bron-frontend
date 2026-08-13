import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/providers/ThemeProvider";
import LangProvider from "@/components/providers/LangProvider";
import ApiProvider from "@/components/providers/ApiProvider";
import { siteConfig, siteMetadata } from "@/config/site";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

export const metadata: Metadata = siteMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={siteConfig.locale} className={manrope.variable} data-theme="light" suppressHydrationWarning>
      <body className={`${manrope.className} min-h-screen antialiased font-sans`}>
        <ThemeProvider>
          <LangProvider>
            <ApiProvider>{children}</ApiProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
