import Sidebar from "@/components/layout/Sidebar/Sidebar";
import Header from "@/components/layout/Header/Header";

export default function MainLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div id="app-shell" className="flex min-h-screen">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="container">
          <Header />
        </div>

        <main className="flex-1">
          <div className="container">{children}</div>
        </main>
      </div>

      {modal}
    </div>
  );
}
