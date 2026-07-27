"use client";

import Link from "next/link";
import CaptureFlow from "@/components/CaptureFlow";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center p-6 gap-8 bg-stone-50">
      <div className="w-full max-w-md flex items-center justify-between mt-8">
        <h1 className="text-2xl font-semibold text-stone-800">Buddy</h1>
        <Link href="/dashboard" className="text-sm text-indigo-600 font-medium">
          Dashboard →
        </Link>
      </div>

      <CaptureFlow />
    </div>
  );
}
