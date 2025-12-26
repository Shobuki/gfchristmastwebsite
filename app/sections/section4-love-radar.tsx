"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, LocateFixed, Radar, ShieldAlert } from "lucide-react";

import { getPublicHeaders, withPublicToken } from "@/lib/public-api";

type LoveRadarProps = {
  onContinue: () => void;
};

type RadarState = "idle" | "scanning" | "result" | "error";

const TARGET_LAT = -6.200000; // Update this target latitude.
const TARGET_LNG = 106.816666; // Update this target longitude.

const toRadians = (value: number) => (value * Math.PI) / 180;

const haversineMeters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) => {
  const radius = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radius * c;
};

export default function LoveRadar({ onContinue }: LoveRadarProps) {
  const [state, setState] = useState<RadarState>("idle");
  const [distanceM, setDistanceM] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [accuracyM, setAccuracyM] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const status = useMemo(() => {
    if (distanceM == null) return null;
    if (distanceM <= 50) return "arrived";
    if (distanceM < 1000) return "near";
    if (distanceM > 10000) return "far";
    return "mid";
  }, [distanceM]);

  const logResult = async (payload: {
    targetLat: number;
    targetLng: number;
    userLat?: number | null;
    userLng?: number | null;
    distanceM?: number | null;
    distanceKm?: number | null;
    accuracyM?: number | null;
    status: string;
    errorMessage?: string | null;
  }) => {
    try {
      await fetch(withPublicToken("/api/love-radar"), {
        method: "POST",
        headers: {
          ...getPublicHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch {
      // Ignore logging errors.
    }
  };

  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setErrorMessage("Browser kamu tidak mendukung lokasi.");
      setState("error");
      void logResult({
        targetLat: TARGET_LAT,
        targetLng: TARGET_LNG,
        status: "unsupported",
        errorMessage: "geolocation not supported",
      });
      return;
    }

    setState("scanning");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const meters = haversineMeters(lat, lng, TARGET_LAT, TARGET_LNG);
        const km = meters / 1000;
        const statusValue =
          meters <= 50
            ? "arrived"
            : meters < 1000
              ? "near"
              : meters > 10000
                ? "far"
                : "mid";
        setDistanceM(meters);
        setDistanceKm(km);
        setAccuracyM(position.coords.accuracy ?? null);
        setErrorMessage(null);
        setState("result");
        void logResult({
          targetLat: TARGET_LAT,
          targetLng: TARGET_LNG,
          userLat: lat,
          userLng: lng,
          distanceM: meters,
          distanceKm: km,
          accuracyM: position.coords.accuracy ?? null,
          status: statusValue,
        });
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Izin lokasi ditolak."
            : "Gagal mengambil lokasi.";
        setErrorMessage(message);
        setState("error");
        void logResult({
          targetLat: TARGET_LAT,
          targetLng: TARGET_LNG,
          status: error.code === error.PERMISSION_DENIED ? "denied" : "error",
          errorMessage: error.message || message,
        });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  const formattedDistance = useMemo(() => {
    if (distanceM == null || distanceKm == null) return "";
    if (distanceM < 1000) {
      return `${Math.round(distanceM)} meter`;
    }
    return `${distanceKm.toFixed(2)} km`;
  }, [distanceM, distanceKm]);

  return (
    <motion.main
      key="love-radar"
      className="relative z-20 min-h-screen overflow-hidden bg-gradient-to-b from-[#071312] via-[#071d1a] to-[#0b0f10] px-5 pb-12 pt-10 text-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.6 }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(34,197,94,0.35),_transparent_65%)]" />
      </div>

      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">
            Love Radar
          </p>
          <h2 className="text-3xl font-semibold [font-family:var(--font-display)]">
            Love Signal
          </h2>
        </div>
        <Radar className="h-7 w-7 text-[#22c55e]" />
      </header>

      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.div
              key="idle"
              className="space-y-4 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-[#fca5a5]">
                <Heart className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold">
                Aku tau lokasimu dimana, sayang.
              </h3>
              <p className="text-sm text-white/70">
                Sinyal kangenku sudah terkunci ke arahmu.
              </p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={requestLocation}
                className="mx-auto flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#22c55e] via-[#4ade80] to-[#bbf7d0] px-6 py-3 text-sm font-semibold text-[#07210f]"
              >
                <LocateFixed className="h-4 w-4" />
                Aktifkan Radar
              </motion.button>
              <button
                onClick={onContinue}
                className="text-xs text-white/50 underline decoration-white/30"
              >
                Lewati dulu
              </button>
            </motion.div>
          )}

          {state === "scanning" && (
            <motion.div
              key="scanning"
              className="flex flex-col items-center justify-center gap-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="relative flex h-40 w-40 items-center justify-center">
                {[0, 1, 2].map((index) => (
                  <motion.div
                    key={index}
                    className="absolute h-full w-full rounded-full border border-emerald-300/30"
                    animate={{ scale: [0.4, 1.3], opacity: [0.6, 0] }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      delay: index * 0.6,
                    }}
                  />
                ))}
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-200">
                  <Radar className="h-6 w-6" />
                </div>
              </div>
              <p className="text-sm text-white/70">
                Mengirim sinyal... cari lokasimu.
              </p>
            </motion.div>
          )}

          {state === "result" && status && (
            <motion.div
              key="result"
              className="space-y-4 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-200">
                <Heart className="h-7 w-7" />
              </div>
              {status === "far" && (
                <>
                  <h3 className="text-xl font-semibold">Long Distance</h3>
                  <p className="text-sm text-white/70">
                    Kita terpisah {formattedDistance}. Jauh, tapi hati kita
                    dekat.
                  </p>
                </>
              )}
              {status === "near" && (
                <>
                  <h3 className="text-xl font-semibold">Close Proximity</h3>
                  <p className="text-sm text-white/70">
                    Kamu dekat banget! Cuma {formattedDistance} lagi. Aku bisa
                    rasain detak jantungmu.
                  </p>
                </>
              )}
              {status === "mid" && (
                <>
                  <h3 className="text-xl font-semibold">Sinyal Terhubung</h3>
                  <p className="text-sm text-white/70">
                    Sekitar {formattedDistance} lagi. Aku tetap kirim cinta ke
                    kamu.
                  </p>
                </>
              )}
              {status === "arrived" && (
                <>
                  <h3 className="text-xl font-semibold">Kamu sudah sampai!</h3>
                  <p className="text-sm text-white/70">
                    Kamu sudah sampai! Tekan tombol di bawah.
                  </p>
                </>
              )}

              {accuracyM != null && (
                <p className="text-xs text-white/50">
                  Akurasi lokasi ±{Math.round(accuracyM)}m
                </p>
              )}

              {status === "arrived" && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={onContinue}
                  className="mx-auto flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#fca5a5] via-[#f472b6] to-[#c4b5fd] px-6 py-3 text-sm font-semibold text-[#2b0f17]"
                >
                  Secret Button
                </motion.button>
              )}

              {status !== "arrived" && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={onContinue}
                  className="mx-auto flex items-center justify-center gap-2 rounded-full bg-white/80 px-6 py-3 text-sm font-semibold text-[#071312]"
                >
                  Lanjutkan
                </motion.button>
              )}
            </motion.div>
          )}

          {state === "error" && (
            <motion.div
              key="error"
              className="space-y-4 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-rose-200">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold">Sinyal Hilang</h3>
              <p className="text-sm text-white/70">
                {errorMessage ||
                  "Yah, sinyalnya ilang. Tapi gak apa-apa, aku tahu kamu ada di hatiku."}
              </p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onContinue}
                className="mx-auto flex items-center justify-center gap-2 rounded-full bg-white/80 px-6 py-3 text-sm font-semibold text-[#071312]"
              >
                Lanjutkan
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  );
}
