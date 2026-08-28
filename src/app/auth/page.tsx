import type { Metadata } from "next";
import AuthFlow from "@/components/features/auth/AuthFlow";

export const metadata: Metadata = {
  title: "Вход",
};

export default function AuthPage() {
  return <AuthFlow initialScreen="welcome" />;
}
