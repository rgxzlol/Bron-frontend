import { Logo } from "@/components/shared/Logo";
import SidebarNav from "./SidebarNav";

export default function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 flex-col pt-[41px] mr-8 lg:flex xl:w-[350px] xl:mr-[93px]">
      <Logo className="pl-8 text-[52px] xl:pl-[64px] xl:text-[70px]" />

      <SidebarNav />
    </aside>
  );
}
