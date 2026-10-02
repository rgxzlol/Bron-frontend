"use client";

import Image from "next/image";
import Link from "next/link";
import { assets } from "@/lib/assets";
import { useProfileStore } from "@/store/profile.store";

type BronLogoProps = {
  size: "sidebar" | "compact";
};

const logoParts = [
  {
    image: assets.bussines.logoBTop,
    left: "0%",
    top: "0%",
    width: "29.4915%",
    height: "75.6522%",
  },
  {
    image: assets.bussines.logoBBottom,
    left: "0%",
    top: "53.0435%",
    width: "32.2034%",
    height: "46.9565%",
  },
  {
    image: assets.bussines.logoR,
    left: "33.5593%",
    top: "28.6957%",
    width: "14.5763%",
    height: "71.3043%",
  },
  {
    image: assets.bussines.logoO,
    left: "49.4915%",
    top: "27.8261%",
    width: "26.7797%",
    height: "72.1739%",
  },
  {
    image: assets.bussines.logoN,
    left: "77.6271%",
    top: "28.6957%",
    width: "22.3729%",
    height: "71.3043%",
  },
] as const;

export default function BronLogo({ size }: BronLogoProps) {
  const theme = useProfileStore((state) => state.theme);

  return (
    <Link
      href="/"
      aria-label="Bron"
      className={`relative block shrink-0 aspect-[59/23] ${
        size === "sidebar" ? "w-full max-w-[220px]" : "w-[96px] lg:hidden"
      }`}
      style={{ filter: theme === "dark" ? "brightness(0) invert(1)" : undefined }}
    >
      {logoParts.map((part) => (
        <span
          key={part.image.src}
          className="absolute"
          style={{
            left: part.left,
            top: part.top,
            width: part.width,
            height: part.height,
          }}
          aria-hidden="true"
        >
          <Image
            src={part.image}
            alt=""
            fill
            sizes={size === "sidebar" ? "220px" : "96px"}
            className="object-contain"
            data-theme-aware
          />
        </span>
      ))}
    </Link>
  );
}
