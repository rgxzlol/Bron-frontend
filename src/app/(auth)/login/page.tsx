import type { Metadata } from "next";
import AuthForm from "@/components/features/auth/AuthForm";

export const metadata: Metadata = {
  title: "Вход",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
