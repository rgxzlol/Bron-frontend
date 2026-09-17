"use client";

import Button from "@/components/shared/Button";
import { useTranslation } from "@/lib/i18n/useTranslation";

export default function FindSpotButton() {
  const { t } = useTranslation();

  function handleClick() {
    const section = document.getElementById("categories");
    if (!section) return;

    section.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <Button
      text={t("home.findPlace")}
      type="button"
      onClick={handleClick}
    />
  );
}
