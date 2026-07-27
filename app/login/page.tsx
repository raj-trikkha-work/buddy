"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("That's not it — try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs flex flex-col gap-4 bg-white rounded-2xl border border-stone-100 shadow-sm p-6"
      >
        <h1 className="text-2xl font-semibold text-center text-stone-800 mb-2">
          Buddy
        </h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Passphrase"
          autoFocus
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white"
        />
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 text-white text-sm py-2"
        >
          Unlock
        </button>
      </form>
    </div>
  );
}
