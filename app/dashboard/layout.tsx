"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import DrawerNav from "@/components/DrawerNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="flex items-center justify-between px-6 pt-6">
        <Link href="/" className="text-2xl font-semibold text-stone-800">
          Buddy
        </Link>
        <button onClick={handleLogout} className="text-xs text-stone-400 underline">
          Log out
        </button>
      </div>
      <DrawerNav />
      <main className="px-4 pb-24">{children}</main>
    </div>
  );
}
