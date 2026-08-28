import type { Metadata } from "next";
import AuthFlow from "@/components/features/auth/AuthFlow";

export const metadata: Metadata = {
  title: "Регистрация",
};

export default function RegisterPage() {
  return <AuthFlow initialScreen="register-personal" />;
}
