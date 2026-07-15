"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import s from "./businessPanelOverlay.module.css";

type BusinessPanelOverlayProps = {
  children: React.ReactNode;
  onClose?: () => void;
};

export default function BusinessPanelOverlay({
  children,
  onClose,
}: BusinessPanelOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={s.backdrop}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className={s.panel} onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
