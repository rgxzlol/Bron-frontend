"use client";

import { assets } from "@/lib/assets";
import Image, { StaticImageData } from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from 'next-intl';

const photos: StaticImageData[] = [
  assets.hero.photo1,
  assets.hero.photo2,
  assets.hero.photo3,
];

type Slot = "left" | "center" | "right";

const slotConfig: Record<
  Slot,
  { offsetX: number; rotate: number; scale: number; zIndex: number }
> = {
  left: { offsetX: -120, rotate: -12, scale: 0.7, zIndex: 1 },
  center: { offsetX: 0, rotate: 0, scale: 1, zIndex: 10 },
  right: { offsetX: 120, rotate: 12, scale: 0.7, zIndex: 1 },
};

function getSlot(imageIndex: number, centerIndex: number): Slot {
  const diff = (imageIndex - centerIndex + photos.length) % photos.length;
  if (diff === 0) return "center";
  if (diff === 1) return "right";
  return "left";
}

const AUTO_PLAY_MS = 5000;

export default function HeroPhotoCarousel() {
  const t = useTranslations('HeroPhotoCarousel');
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
      className="relative h-[250px] w-[min(100%,400px)] shrink-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {photos.map((src, index) => {
        const slot = getSlot(index, centerIndex);
        const { offsetX, rotate, scale, zIndex } = slotConfig[slot];

        return (
          <div
            key={src.src || index}
            className="absolute left-1/2 top-1/2 origin-center transition-all duration-700 ease-in-out will-change-transform"
            style={{
              zIndex,
              transform: `translate(calc(-50% + ${offsetX}px), -50%) rotate(${rotate}deg) scale(${scale})`,
            }}
          >
            <Image
              src={src}
              alt={`${t('serviceExample')} ${index + 1}`}
              width={157}
              height={242}
              priority
              className="rounded-[32px] object-cover shadow-lg border border-transparent"
            />
          </div>
        );
      })}
    </div>
  );
}