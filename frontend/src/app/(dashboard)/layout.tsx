import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("spectre_api_key");
  if (!token) redirect("/login");

  return (
    <div className="flex h-screen bg-obsidian-950 overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="md:hidden">
          <MobileNav />
        </div>
        <TopBar />
        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 bg-obsidian-950 bg-grid-obsidian bg-grid">
          {children}
        </main>
      </div>
    </div>
  );
}
