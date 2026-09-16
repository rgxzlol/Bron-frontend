import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ThemeProvider from "@/components/providers/ThemeProvider";
import LangProvider from "@/components/providers/LangProvider";
import ApiProvider from "@/components/providers/ApiProvider";
import RapidClickGuard from "@/components/providers/RapidClickGuard";
import { siteConfig, siteMetadata } from "@/config/site";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

export const metadata: Metadata = siteMetadata;
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={siteConfig.locale} className={manrope.variable} data-theme="light" suppressHydrationWarning>
      <head>
        <Script
          id="theme-preload"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem("profile-storage");if(!s)return;var p=JSON.parse(s);var t=p.state&&p.state.theme;if(t==="dark"||t==="light"){document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${manrope.className} min-h-screen antialiased font-sans`}>
        <ThemeProvider>
          <LangProvider>
            <ApiProvider>
              <RapidClickGuard />
              {children}
            </ApiProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
