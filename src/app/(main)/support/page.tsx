import type { Metadata } from "next";
import Support from "@/components/features/support/Support";

export const metadata: Metadata = {
  title: "Поддержка",
};

export default function SupportPage() {
  return (
    <>
      <Support />
    </>
  );
}