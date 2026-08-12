import Sidebar from "@/components/layout/Sidebar/Sidebar";
import Header from "@/components/layout/Header/Header";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

            <div className="flex min-w-0 flex-1 flex-col">
                <div className="sticky top-0 z-50 bg-[#FAFAFF]/80 backdrop-blur-md">
                    <div className="container">
                        <Header />
                    </div>
                </div>

                <main className="flex-1">
                    <div className="container">{children}</div>
                </main>
            </div>
        </div>

        <main className="flex-1">
          <div className="container">{children}</div>
        </main>
      </div>
    </div>
  );
}
