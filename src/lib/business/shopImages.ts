import type { StaticImageData } from "next/image";
import type { ShopsType } from "@/types/shops.types";

export function isRemoteShopImage(
  image: StaticImageData | string,
): image is string {
  return typeof image === "string";
}

export function getShopGallery(shop: ShopsType): (StaticImageData | string)[] {
  const photos: (StaticImageData | string)[] = [];
  const seen = new Set<string>();

  const add = (image?: StaticImageData | string | null) => {
    if (!image) return;

    if (typeof image === "string") {
      if (seen.has(image)) return;
      seen.add(image);
      photos.push(image);
      return;
    }

    photos.push(image);
  };

  if (shop.gallery?.length) {
    shop.gallery.forEach(add);
  } else {
    add(shop.profilePhoto);
    add(shop.img);
  }

  return photos.length > 0 ? photos : [shop.img];
}
