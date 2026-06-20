import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile top + bottom nav */}
      <MobileNav />

      {/* Main content — offset on desktop, padded top+bottom on mobile for nav bars */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-[280px] pt-14 lg:pt-0 pb-16 lg:pb-0">
        {children}
      </div>
    </div>
  );
}
