import type { Metadata } from "next";
import AuthPageContent from "@/components/features/auth/AuthPageContent";

export const metadata: Metadata = {
  title: "Вход",
};

export default function AuthPage() {
  return <AuthPageContent />;
}
