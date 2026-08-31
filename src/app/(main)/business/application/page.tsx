import BusinessApplicationForm from "@/components/features/business/BusinessApplicationForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Application Form",
};

export default function BusinessApplicationPage() {
  return (
    <div className="py-4 sm:py-6 md:py-10">
      <BusinessApplicationForm />
    </div>
  );
}
