"use client";

import { useMemo } from "react";
import { useProfileStore } from "@/store/profile.store";
import { createTranslator } from "./createTranslator";
import { getMessages } from "./messages";
import { toBcp47 } from "./locale";

export function useTranslation() {
  const language = useProfileStore((state) => state.language);

  const t = useMemo(() => createTranslator(getMessages(language)), [language]);
  const locale = useMemo(() => toBcp47(language), [language]);

  return { t, language, locale };
}
