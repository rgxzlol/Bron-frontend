import Business from "@/components/features/business/Business"
import type { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Бизнес",
}

export default function BusinessPage() {
  return (
    <Suspense fallback={null}>
      <Business />
    </Suspense>
  );
}