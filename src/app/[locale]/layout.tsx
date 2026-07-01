import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "../globals.css";
import { siteConfig, siteMetadata } from "@/config/site";
import { getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

export const metadata: Metadata = siteMetadata;

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();
  return (
    <html lang={siteConfig.locale} className={manrope.variable}>
      <body
        className={`${manrope.className} min-h-screen antialiased font-sans`}
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
