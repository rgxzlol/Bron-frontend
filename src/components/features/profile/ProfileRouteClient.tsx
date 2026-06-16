"use client";

import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";
import ProfileModal from "./ProfileModal";

export default function ProfileRouteClient() {
  const router = useRouter();

  return (
    <ProfileModal
      isOpen
      onClose={() => {
        router.push(routes.home);
      }}
    />
  );
}
