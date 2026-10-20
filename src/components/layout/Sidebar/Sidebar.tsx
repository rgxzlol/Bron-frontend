import BronLogo from "@/components/shared/BronLogo";
import SidebarNav from "./SidebarNav";

export default function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[280px] shrink-0 flex-col pt-[41px] mr-8 lg:flex xl:w-[350px] xl:mr-[93px]">
      <div className="pl-8 xl:pl-[64px]">
        <BronLogo size="sidebar" />
      </div>

      <SidebarNav />
    </aside>
  );
}
