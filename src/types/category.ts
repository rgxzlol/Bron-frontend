import type { StaticImageData } from "next/image";

export type Category = {
  id: number;
  title: string;
  icon: StaticImageData;
  color: string;
  count: number;
};
