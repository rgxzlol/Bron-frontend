import type { Metadata } from "next";
import ProfileRouteClient from "@/components/features/profile/ProfileRouteClient";

export const metadata: Metadata = {
  title: "Профиль",
};

export default function ProfilePage() {
  return <ProfileRouteClient />;
}
