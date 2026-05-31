"use client";

import icons from "@/utils/images";
import Image, { StaticImageData } from "next/image";
import { useEffect, useState } from "react";

const photos: StaticImageData[] = [
  icons.mainPhoto1,
  icons.mainPhoto2,
  icons.mainPhoto3,
];

type Slot = "left" | "center" | "right";

const slotConfig: Record<
  Slot,
  { offsetX: number; rotate: number; scale: number; zIndex: number }
> = {
  left: { offsetX: -130, rotate: -12, scale: 0.78, zIndex: 1 },
  center: { offsetX: 0, rotate: 0, scale: 1, zIndex: 10 },
  right: { offsetX: 130, rotate: 12, scale: 0.78, zIndex: 1 },
};

function getSlot(imageIndex: number, centerIndex: number): Slot {
  const diff = (imageIndex - centerIndex + 3) % 3;
  if (diff === 0) return "center";
  if (diff === 1) return "right";
  return "left";
}

export default function HeroPhotoCarousel() {
  const [centerIndex, setCenterIndex] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setCenterIndex((prev) => (prev + 1) % photos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[400px] w-[min(100%,520px)] shrink-0">
      {photos.map((src, index) => {
        const slot = getSlot(index, centerIndex);
        const { offsetX, rotate, scale, zIndex } = slotConfig[slot];

        return (
          <div
            key={index}
            className="absolute left-1/2 top-1/2 origin-center transition-all duration-700 ease-in-out"
            style={{
              zIndex,
              transform: `translate(calc(-50% + ${offsetX}px), -50%) rotate(${rotate}deg) scale(${scale})`,
            }}
          >
            <Image
              src={src}
              alt=""
              width={280}
              height={380}
              priority={slot === "center"}
              className="h-[380px] w-[280px] rounded-[32px] object-cover shadow-lg"
            />
          </div>
        );
      })}
    </div>
  );
}
