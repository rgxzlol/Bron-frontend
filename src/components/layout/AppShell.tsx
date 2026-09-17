import Sidebar from "@/components/layout/Sidebar/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import Header from "@/components/layout/Header/Header";
import ToastContainer from "@/components/shared/ToastContainer";
import BusinessApplicationStatusModals from "@/components/features/business/BusinessApplicationStatusModals";
import BusinessApplicationSync from "@/components/features/business/BusinessApplicationSync";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="container">
          <Header />
        </div>

        <main className="flex-1 pb-28 lg:pb-0">
          <div className="container">{children}</div>
        </main>
      </div>

      <BottomNav />
      <ToastContainer />
      <BusinessApplicationSync />
      <BusinessApplicationStatusModals />
    </div>
  );
}
