import type { Metadata } from "next";

export const siteConfig = {
  name: "Bron",
  description: "Бронирование салонов красоты, спа, фитнеса и других сервисов",
  locale: "ru",
} as const;

export const siteMetadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};
