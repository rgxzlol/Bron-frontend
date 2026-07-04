"use client";

import { useEffect } from "react";
import { useProfileStore } from "@/store/profile.store";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useProfileStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return children;
}
