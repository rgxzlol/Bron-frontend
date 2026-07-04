"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";
import { useAuthHydrated } from "@/lib/auth/useAuthHydrated";
import { useAuthStore } from "@/store/auth.store";
import ProfileModal from "./ProfileModal";

export default function ProfileRouteClient() {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (hydrated && !token) {
      router.replace(routes.login);
    }
  }, [hydrated, token, router]);

  if (!hydrated || !token) {
    return null;
  }

  return (
    <ProfileModal
      isOpen
      onClose={() => {
        router.push(routes.home);
      }}
    />
  );
}
