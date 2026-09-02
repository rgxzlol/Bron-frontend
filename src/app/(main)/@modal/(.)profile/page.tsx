"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";
import { useAuthReady } from "@/lib/auth/useAuthReady";
import { useAuthStore } from "@/store/auth.store";
import ProfileModal from "@/components/features/profile/ProfileModal";

export default function ProfileModalSlotPage() {
  const router = useRouter();
  const authReady = useAuthReady();
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (authReady && !token) {
      router.replace(routes.auth);
    }
  }, [authReady, token, router]);

  if (!authReady || !token) return null;

  return (
    <ProfileModal
      isOpen
      onClose={() => {
        router.back();
      }}
    />
  );
}

