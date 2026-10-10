import type { Metadata } from "next";

export const siteConfig = {
  name: "Bron",
  description: "Бронирование салонов красоты, спа, фитнеса и других сервисов",
  locale: "ru",
  version: "1.0.0",
} as const;

export const siteMetadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    shortcut: "/favicon-32.png",
  },
};
