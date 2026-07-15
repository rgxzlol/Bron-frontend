"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";
import { siteConfig } from "@/config/site";
import { createTranslator, type Translator } from "@/lib/i18n/createTranslator";
import { toHtmlLang } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";
import { useProfileStore } from "@/store/profile.store";

function resolveDocumentTitle(pathname: string, t: Translator): string {
  if (
    pathname === routes.home ||
    pathname === "/" ||
    pathname === ""
  ) {
    return siteConfig.name;
  }

  let pageTitle: string | null = null;

  if (pathname.startsWith(routes.bookings)) {
    pageTitle = t("meta.bookings");
  } else if (pathname.startsWith(routes.profile)) {
    pageTitle = t("meta.profile");
  } else if (pathname.startsWith(routes.support)) {
    pageTitle = t("meta.support");
  } else if (pathname.startsWith(routes.business)) {
    pageTitle = t("meta.business");
  } else if (
    pathname.startsWith(routes.login) ||
    pathname.startsWith(routes.auth)
  ) {
    pageTitle = t("meta.login");
  } else if (pathname.startsWith(routes.register)) {
    pageTitle = t("meta.register");
  } else if (pathname.startsWith(routes.map)) {
    pageTitle = t("nav.map");
  }

  return pageTitle
    ? `${pageTitle} | ${siteConfig.name}`
    : siteConfig.name;
}

export default function LangProvider({ children }: { children: React.ReactNode }) {
  const language = useProfileStore((state) => state.language);
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.lang = toHtmlLang(language);
  }, [language]);

  useEffect(() => {
    const t = createTranslator(getMessages(language));
    document.title = resolveDocumentTitle(pathname, t);
  }, [language, pathname]);

  return children;
}
