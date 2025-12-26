"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";

type LockedProps = {
  warming: boolean;
  onStartHold: () => void;
  onStopHold: () => void;
  onUnlock: () => void;
};

export default function Locked({
  warming,
  onStartHold,
  onStopHold,
  onUnlock,
}: LockedProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Username dan password wajib diisi.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        setError("Login gagal. Coba lagi.");
        return;
      }
      const data = await res.json();
      localStorage.setItem("adminToken", data.token);
      onUnlock();
    } catch {
      setError("Login gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.main
      key="locked"
      className="relative z-20 flex min-h-screen flex-col items-center justify-center px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#dbefff] via-[#c8e3ff] to-[#f8fbff]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.7),_rgba(255,255,255,0.1),_transparent_70%)]" />
      <div className="relative z-10 mx-auto max-w-sm rounded-[32px] border border-white/40 bg-white/30 p-8 shadow-[0_30px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/60 text-[#7aa9d6]">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="mb-3 text-3xl font-semibold text-[#22425e] [font-family:var(--font-display)]">
          Frozen Heart
        </h1>
        <p className="mb-6 text-sm font-medium text-[#3d5d78]">
          Sentuh lama atau klik untuk mencairkan es ini.
        </p>
        <div className="mb-5 space-y-3 text-left">
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
            className="w-full rounded-2xl border border-white/50 bg-white/60 px-4 py-3 text-sm text-[#22425e] placeholder:text-[#5b7b97]"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-2xl border border-white/50 bg-white/60 px-4 py-3 text-sm text-[#22425e] placeholder:text-[#5b7b97]"
          />
          {error && <p className="text-xs text-rose-500">{error}</p>}
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: warming
              ? "0 0 30px rgba(255,120,120,0.8)"
              : "0 0 0 rgba(0,0,0,0)",
          }}
          className="mx-auto flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff8ba7] via-[#ffb3c7] to-[#ffd6e5] px-6 py-4 text-base font-semibold text-[#7a1c30] disabled:cursor-not-allowed disabled:opacity-70"
          onPointerDown={onStartHold}
          onPointerUp={onStopHold}
          onPointerLeave={onStopHold}
          onClick={handleLogin}
          disabled={loading}
        >
          <Sparkles className="h-5 w-5" />
          {loading ? "Membuka..." : "Hangatkan Aku"}
        </motion.button>
      </div>
    </motion.main>
  );
}
