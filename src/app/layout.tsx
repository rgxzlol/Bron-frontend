import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
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
    <html lang={siteConfig.locale} className={manrope.variable}>
      <body
        className={`${manrope.className} min-h-screen antialiased font-sans`}
      >
        <div className="flex min-h-screen">
          <Sidebar />

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="container">
              <Header />
            </div>

            <main className="flex-1">
              <div className="container">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
