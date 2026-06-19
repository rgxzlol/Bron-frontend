import Header from "@/components/layout/Header/Header"
import Sidebar from "@/components/layout/Sidebar/Sidebar"

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />

            <div className="flex min-w-0 flex-1 flex-col">
                <div className="container">
                    <Header />
                </div>

                <main className="flex-1">
                    <div className="container">{children}</div>
                </main>
            </div>
        </div>
    )
}
