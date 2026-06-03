import Business from "@/components/features/business/Business"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Бизнес",
}

export default function BusinessPage() {
  return (
    <div className="relative min-h-[calc(100dvh-13rem)]">
      <Business />
    </div>
  )
}