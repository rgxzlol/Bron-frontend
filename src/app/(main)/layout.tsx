import AppShell from "@/components/layout/AppShell";

export default function MainLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      <AppShell>{children}</AppShell>
      {modal}
    </>
  );
}
