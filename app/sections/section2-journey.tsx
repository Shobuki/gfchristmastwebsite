"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Heart, PartyPopper } from "lucide-react";

import { getPublicHeaders, withPublicToken } from "@/lib/public-api";

type JourneyProps = {
  onStartGame: () => void;
};

type JourneyItem = {
  id: number;
  category: "sweet" | "funny";
  title: string;
  caption: string;
  url: string | null;
};

type LayoutSettings = {
  journeyColumns: number;
};

export default function Journey({ onStartGame }: JourneyProps) {
  const [items, setItems] = useState<JourneyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<JourneyItem | null>(null);
  const [layout, setLayout] = useState<LayoutSettings>({ journeyColumns: 2 });

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch(withPublicToken("/api/journey"), {
          headers: getPublicHeaders(),
          cache: "no-store",
        });
        if (!res.ok) {
          setItems([]);
          return;
        }
        const data = await res.json();
        setItems(data.items || []);
      } finally {
        setLoading(false);
      }
    };
    const fetchLayout = async () => {
      try {
        const res = await fetch(withPublicToken("/api/layout"), {
          headers: getPublicHeaders(),
          cache: "no-store",
        });
        const data = await res.json();
        if (data?.item?.journey_columns) {
          setLayout({ journeyColumns: data.item.journey_columns });
        }
      } catch {
        // ignore
      }
    };
    fetchItems();
    fetchLayout();
  }, []);

  const sweetItems = useMemo(
    () => items.filter((item) => item.category === "sweet"),
    [items],
  );
  const funnyItems = useMemo(
    () => items.filter((item) => item.category === "funny"),
    [items],
  );

  return (
    <motion.main
      key="journey"
      className="relative z-20 min-h-screen overflow-hidden bg-gradient-to-b from-[#3a0b19] via-[#5a0f25] to-[#1b0a0f] px-5 pb-10 pt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.6 }}
    >
      <header className="mb-6 flex items-center justify-between text-white">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Our Journey
          </p>
          <h2 className="text-3xl font-semibold [font-family:var(--font-display)]">
            Anniversary x Christmas
          </h2>
        </div>
        <Heart className="h-7 w-7 text-[#ffb6c9]" />
      </header>

      <div className="space-y-6 overflow-y-auto pb-24 pr-1">
        <motion.section
          className="rounded-3xl bg-white/10 p-5 backdrop-blur-md"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <p className="mb-3 text-sm font-semibold text-[#ffb6c9]">Manis</p>
          {loading ? (
            <p className="text-sm text-white/70">Loading...</p>
          ) : (
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${layout.journeyColumns}, minmax(0, 1fr))`,
              }}
            >
              {sweetItems.map((item) => (
                <motion.button
                  key={item.id}
                  type="button"
                  className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-white/15 text-left"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setActiveImage(item)}
                >
                  {/* Replace with your photo */}
                  <img
                    src={
                      item.url ||
                      "https://placehold.co/400x600?text=Sweet+Memory"
                    }
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition group-hover:opacity-100" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-xs font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[11px] text-white/80">
                      {item.caption}
                    </p>
                  </div>
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10" />
                </motion.button>
              ))}
            </div>
          )}
        </motion.section>

        <motion.section
          className="rounded-3xl bg-white/10 p-5 backdrop-blur-md"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <p className="mb-3 text-sm font-semibold text-[#ffd166]">Chaos</p>
          {loading ? (
            <p className="text-sm text-white/70">Loading...</p>
          ) : (
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${layout.journeyColumns}, minmax(0, 1fr))`,
              }}
            >
              {funnyItems.map((item) => (
                <motion.button
                  key={item.id}
                  type="button"
                  className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-white/15 text-left"
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setActiveImage(item)}
                >
                  {/* Replace with your funny photo */}
                  <img
                    src={
                      item.url ||
                      "https://placehold.co/400x600?text=Funny+Memory"
                    }
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition group-hover:opacity-100" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-xs font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="mt-1 text-[11px] text-white/80">
                      {item.caption}
                    </p>
                  </div>
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10" />
                </motion.button>
              ))}
            </div>
          )}
        </motion.section>
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onStartGame}
        className="fixed bottom-6 left-1/2 z-30 flex w-[86%] -translate-x-1/2 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ffb347] via-[#ff8c7a] to-[#ff6b9a] px-6 py-4 text-base font-semibold text-[#3a0b19] shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
      >
        <PartyPopper className="h-5 w-5" />
        Mulai Cosmic Timeline
      </motion.button>

      <motion.div
        className={`fixed inset-0 z-40 flex items-center justify-center bg-black/80 px-4 ${
          activeImage ? "pointer-events-auto" : "pointer-events-none opacity-0"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: activeImage ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => setActiveImage(null)}
      >
        {activeImage && (
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-black/80"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
          >
            <img
              src={
                activeImage.url ||
                "https://placehold.co/400x600?text=Journey+Memory"
              }
              alt={activeImage.title}
              className="max-h-[80vh] w-full object-contain"
            />
            <div className="p-4 text-sm text-white/80">
              <p className="text-base font-semibold text-white">
                {activeImage.title}
              </p>
              <p className="mt-1 text-xs text-white/70">
                {activeImage.caption}
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.main>
  );
}
