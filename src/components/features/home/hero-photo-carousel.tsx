"use client";

import { assets } from "@/lib/assets";
import Image, { StaticImageData } from "next/image";
import { useEffect, useState } from "react";

const photos: StaticImageData[] = [
  assets.hero.photo1,
  assets.hero.photo2,
  assets.hero.photo3,
];

type Slot = "left" | "center" | "right";

/** Positions are % of the carousel width so side cards stay on-screen. */
const slotConfig: Record<
  Slot,
  { left: string; rotate: number; scale: number; zIndex: number }
> = {
  left: { left: "22%", rotate: -10, scale: 0.72, zIndex: 1 },
  center: { left: "50%", rotate: 0, scale: 1, zIndex: 10 },
  right: { left: "78%", rotate: 10, scale: 0.72, zIndex: 1 },
};

function getSlot(imageIndex: number, centerIndex: number): Slot {
  const diff = (imageIndex - centerIndex + photos.length) % photos.length;
  if (diff === 0) return "center";
  if (diff === 1) return "right";
  return "left";
}

const AUTO_PLAY_MS = 5000;

export default function HeroPhotoCarousel() {
  const [centerIndex, setCenterIndex] = useState(1);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;

    const timer = setInterval(() => {
      setCenterIndex((prev) => (prev + 1) % photos.length);
    }, AUTO_PLAY_MS);

    return () => clearInterval(timer);
  }, [isHovered]);

  return (
    <div
      className="relative mx-auto h-[min(250px,58vw)] w-full max-w-[min(100%,360px)] shrink-0 lg:mx-0 lg:h-[250px] lg:max-w-[400px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {photos.map((src, index) => {
        const slot = getSlot(index, centerIndex);
        const { left, rotate, scale, zIndex } = slotConfig[slot];

        return (
          <div
            key={src.src || index}
            className="absolute top-1/2 aspect-[157/242] w-[min(40%,157px)] origin-center transition-all duration-700 ease-in-out will-change-transform"
            style={{
              left,
              zIndex,
              transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`,
            }}
          >
            <Image
              src={src}
              alt={`Пример сервиса ${index + 1}`}
              fill
              sizes="157px"
              priority
              className="rounded-[clamp(18px,5vw,32px)] object-cover shadow-lg border border-transparent"
            />
          </div>
        );
      })}
    </div>
  );
}
