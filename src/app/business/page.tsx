import Business from "@/components/features/business/Business"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Бизнес",
}

export default function BusinessPage() {
  return <Business />;
}