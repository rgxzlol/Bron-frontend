"use client";

import { useEffect } from "react";

const RAPID_CLICK_WINDOW_MS = 500;

export default function RapidClickGuard() {
  useEffect(() => {
    const lastClickAt = new WeakMap<HTMLButtonElement, number>();

    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest("button");
      if (!(button instanceof HTMLButtonElement) || button.disabled) return;

      const now = Date.now();
      const previousClickAt = lastClickAt.get(button);

      if (
        previousClickAt !== undefined &&
        now - previousClickAt < RAPID_CLICK_WINDOW_MS
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }

      lastClickAt.set(button, now);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
}
