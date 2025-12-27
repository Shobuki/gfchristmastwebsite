"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coins, Crown, Gift, Sparkles, Star } from "lucide-react";

import { getPublicHeaders, withPublicToken } from "@/lib/public-api";

type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";

type GachaItem = {
  id: number;
  rarity: Rarity;
  title: string;
  caption: string;
  image: string;
};

type LayoutSettings = {
  gachaColumns: number;
};

type GachaProps = {
  onUnlockLetter: () => void;
};

const RARITY_LABEL: Record<Rarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythic: "Mythic",
};

const RARITY_STYLES: Record<Rarity, string> = {
  common: "from-slate-400/60 via-slate-300/40 to-slate-100/40 text-slate-900",
  rare: "from-sky-500/70 via-cyan-400/60 to-sky-200/60 text-slate-900",
  epic: "from-fuchsia-500/70 via-pink-400/60 to-rose-200/60 text-slate-900",
  legendary: "from-amber-400 via-yellow-300 to-orange-200 text-amber-900",
  mythic: "from-violet-500 via-indigo-400 to-sky-200 text-white",
};

const RARITY_ORDER: Rarity[] = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic",
];

export default function Gacha({ onUnlockLetter }: GachaProps) {
  const [coins, setCoins] = useState(5);
  const [tapCount, setTapCount] = useState(0);
  const [modalItem, setModalItem] = useState<GachaItem | null>(null);
  const [fullScreenItem, setFullScreenItem] = useState<GachaItem | null>(null);
  const [collected, setCollected] = useState<Set<number>>(new Set());
  const [santaPos, setSantaPos] = useState({ x: 0, y: 0 });
  const [uploadsById, setUploadsById] = useState<Record<number, string>>({});
  const [layout, setLayout] = useState<LayoutSettings>({ gachaColumns: 2 });
  const [items, setItems] = useState<GachaItem[]>([]);
  const [rarityWeights, setRarityWeights] = useState<Record<Rarity, number>>({
    common: 55,
    rare: 25,
    epic: 12,
    legendary: 6,
    mythic: 2,
  });
  const santaAreaRef = useRef<HTMLDivElement | null>(null);
  const coinsLoadedRef = useRef(false);

  const collectedCount = collected.size;
  const tapProgress = Math.min(5, tapCount);

  const itemsWithUploads = useMemo(() => {
    return items.map((item) => ({
      ...item,
      image:
        uploadsById[item.id] ||
        item.image ||
        "https://placehold.co/400x600?text=Gacha+Memory",
    }));
  }, [items, uploadsById]);

  const saveCollected = (itemId: number) => {
    return fetch(withPublicToken("/api/gacha-results"), {
      method: "POST",
      headers: {
        ...getPublicHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gachaItemId: itemId }),
    });
  };

  const fetchCollected = async () => {
    try {
      console.debug("[gacha] fetch /api/gacha-results start");
      const res = await fetch(withPublicToken("/api/gacha-results"), {
        headers: getPublicHeaders(),
      });
      console.debug("[gacha] fetch /api/gacha-results status", res.status);
      const data = await res.json();
      if (Array.isArray(data?.items)) {
        const ids = data.items
          .map((id: unknown) => Number(id))
          .filter((id: number) => Number.isFinite(id));
        console.debug("[gacha] /api/gacha-results items", ids.length);
        setCollected(new Set(ids));
      }
    } catch {
      // ignore
      console.debug("[gacha] fetch /api/gacha-results failed");
    }
  };

  const poolByRarity = useMemo(() => {
    return {
      common: itemsWithUploads.filter((item) => item.rarity === "common"),
      rare: itemsWithUploads.filter((item) => item.rarity === "rare"),
      epic: itemsWithUploads.filter((item) => item.rarity === "epic"),
      legendary: itemsWithUploads.filter((item) => item.rarity === "legendary"),
      mythic: itemsWithUploads.filter((item) => item.rarity === "mythic"),
    };
  }, [itemsWithUploads]);

  const updateCoins = (delta: number) => {
    setCoins((prev) => {
      const next = Math.max(0, prev + delta);
      if (coinsLoadedRef.current) {
        void fetch(withPublicToken("/api/gacha-state"), {
          method: "POST",
          headers: {
            ...getPublicHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ coins: next }),
        });
      }
      return next;
    });
  };

  useEffect(() => {
    const fetchUploads = async () => {
      try {
        console.debug("[gacha] fetch /api/pictures start");
        const res = await fetch(withPublicToken("/api/pictures?gachaOnly=1"), {
          headers: getPublicHeaders(),
        });
        console.debug("[gacha] fetch /api/pictures status", res.status);
        const data = await res.json();
        console.debug(
          "[gacha] /api/pictures items",
          Array.isArray(data.items) ? data.items.length : 0,
        );
        const latestMap: Record<number, string> = {};
        for (const item of data.items || []) {
          if (item.gachaId && !latestMap[item.gachaId]) {
            latestMap[item.gachaId] = item.url;
          }
        }
        setUploadsById(latestMap);
      } catch {
        // Ignore fetch errors and keep placeholders.
        console.debug("[gacha] fetch /api/pictures failed");
      }
    };
    fetchUploads();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        console.debug("[gacha] fetch /api/gacha-items start");
        const res = await fetch(withPublicToken("/api/gacha-items"), {
          headers: getPublicHeaders(),
        });
        console.debug("[gacha] fetch /api/gacha-items status", res.status);
        const data = await res.json();
        console.debug(
          "[gacha] /api/gacha-items items",
          Array.isArray(data.items) ? data.items.length : 0,
        );
        const mapped =
          (data.items || []).map((item: GachaItem) => ({
            ...item,
            image: "",
          })) || [];
        setItems(mapped);
      } catch {
        // ignore
        console.debug("[gacha] fetch /api/gacha-items failed");
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    void fetchCollected();
  }, []);

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        console.debug("[gacha] fetch /api/gacha-state start");
        const res = await fetch(withPublicToken("/api/gacha-state"), {
          headers: getPublicHeaders(),
        });
        console.debug("[gacha] fetch /api/gacha-state status", res.status);
        const data = await res.json();
        if (typeof data?.coins === "number") {
          setCoins(data.coins);
        }
      } catch {
        // ignore
        console.debug("[gacha] fetch /api/gacha-state failed");
      } finally {
        coinsLoadedRef.current = true;
      }
    };
    fetchCoins();
  }, []);

  useEffect(() => {
    const area = santaAreaRef.current;
    if (!area) return;

    const moveSanta = () => {
      const rect = area.getBoundingClientRect();
      const maxX = Math.max(0, rect.width - 56);
      const maxY = Math.max(0, rect.height - 56);
      setSantaPos({
        x: Math.random() * maxX,
        y: Math.random() * maxY,
      });
    };

    moveSanta();
    const interval = setInterval(moveSanta, 800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        console.debug("[gacha] fetch /api/layout start");
        const res = await fetch(withPublicToken("/api/layout"), {
          headers: getPublicHeaders(),
        });
        console.debug("[gacha] fetch /api/layout status", res.status);
        const data = await res.json();
        if (data?.item?.gacha_columns) {
          setLayout({ gachaColumns: data.item.gacha_columns });
        }
      } catch {
        // ignore
        console.debug("[gacha] fetch /api/layout failed");
      }
    };
    fetchLayout();
  }, []);

  useEffect(() => {
    const fetchRarity = async () => {
      try {
        console.debug("[gacha] fetch /api/gacha-rarity start");
        const res = await fetch(withPublicToken("/api/gacha-rarity"), {
          headers: getPublicHeaders(),
        });
        console.debug("[gacha] fetch /api/gacha-rarity status", res.status);
        const data = await res.json();
        const next = { ...rarityWeights };
        for (const row of data.items || []) {
          if (RARITY_ORDER.includes(row.rarity)) {
            next[row.rarity as Rarity] = Number(row.weight) || 0;
          }
        }
        setRarityWeights(next);
      } catch {
        // ignore
        console.debug("[gacha] fetch /api/gacha-rarity failed");
      }
    };
    fetchRarity();
  }, []);

  const rollRarity = (available: Rarity[]) => {
    if (available.length === 0) return "common" as Rarity;
    const total = available.reduce(
      (sum, rarity) => sum + Math.max(0, rarityWeights[rarity] || 0),
      0,
    );
    if (total <= 0) return available[0];
    let roll = Math.random() * total;
    for (const rarity of available) {
      const weight = Math.max(0, rarityWeights[rarity] || 0);
      if (roll < weight) return rarity;
      roll -= weight;
    }
    return available[0];
  };

  const handlePull = () => {
    if (coins <= 0 || items.length === 0) return;
    const available = RARITY_ORDER.filter(
      (rarity) => poolByRarity[rarity]?.length > 0,
    );
    const rarity = rollRarity(available);
    const pool = poolByRarity[rarity];
    if (!pool || pool.length === 0) return;
    updateCoins(-1);
    const item = pool[Math.floor(Math.random() * pool.length)];
    setModalItem(item);
    if (!collected.has(item.id)) {
      void saveCollected(item.id).then(() => fetchCollected());
    }
    setCollected((prev) => {
      const next = new Set(prev);
      next.add(item.id);
      return next;
    });
  };

  const handleSantaTap = () => {
    setTapCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        updateCoins(1);
        return 0;
      }
      return next;
    });
  };

  return (
    <motion.main
      key="gacha"
      className="relative z-20 min-h-screen bg-gradient-to-b from-[#1b0c20] via-[#28102b] to-[#12070f] px-5 pb-12 pt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.6 }}
    >
      <header className="mb-6 flex items-center justify-between text-white">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            The Gacha of Memories
          </p>
          <h2 className="text-3xl font-semibold [font-family:var(--font-display)]">
            Mesin Kenangan
          </h2>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
          <Coins className="h-4 w-4 text-[#fcd34d]" />
          {coins} Koin
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <motion.div
            className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/10 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
            whileHover={{ scale: 1.01 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_60%)]" />
            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-2 text-sm text-white/70">
                <Gift className="h-4 w-4 text-[#f472b6]" />
                3D Gift Stack
              </div>
              <div className="relative mx-auto h-52 w-full max-w-sm [perspective:1200px]">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative h-36 w-44 [transform-style:preserve-3d] [transform:rotateX(18deg)_rotateY(-18deg)]">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#ff9a9e] via-[#fecfef] to-[#fad0c4] shadow-[0_20px_40px_rgba(0,0,0,0.35)]" />
                    <div className="absolute left-1/2 top-2 h-32 w-8 -translate-x-1/2 rounded-full bg-white/60" />
                    <div className="absolute left-4 top-2 h-32 w-2 rounded-full bg-white/40" />
                    <div className="absolute right-4 top-2 h-32 w-2 rounded-full bg-white/40" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-6 h-12 w-16 rounded-xl bg-gradient-to-br from-[#ffd3a5] to-[#fd6585] shadow-[0_10px_25px_rgba(0,0,0,0.3)] [transform:translateZ(40px)_rotateX(12deg)]" />
                <div className="absolute bottom-6 right-8 h-10 w-14 rounded-xl bg-gradient-to-br from-[#a1c4fd] to-[#c2e9fb] shadow-[0_10px_25px_rgba(0,0,0,0.25)] [transform:translateZ(20px)_rotateX(10deg)]" />
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                <p className="mb-2 font-semibold text-white">Cara Main</p>
                <p>
                  Tekan tombol <span className="font-semibold">PULL</span> untuk
                  membuka hadiah. Rarity bisa common, rare, atau legendary.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-3">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handlePull}
              disabled={coins <= 0}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f472b6] via-[#f59e0b] to-[#fcd34d] px-6 py-4 text-base font-semibold text-[#3f1d2c] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles className="h-5 w-5" />
              {coins > 0 ? "PULL / ROLL" : "Koin Habis"}
            </motion.button>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              <div className="flex items-center justify-between">
                <span>Collection</span>
                <span>
                  {collectedCount}/{items.length}
                </span>
              </div>
              <div
                className="mt-3 grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${layout.gachaColumns}, minmax(0, 1fr))`,
                }}
              >
                {itemsWithUploads.map((item) => {
                  const isCollected = collected.has(item.id);
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() =>
                        isCollected ? setFullScreenItem(item) : null
                      }
                      className={`relative h-12 overflow-hidden rounded-xl border border-white/10 transition ${
                        isCollected
                          ? "bg-white/20"
                          : "bg-white/5 opacity-40"
                      }`}
                    >
                      {isCollected ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Star className="h-4 w-4 text-[#fcd34d]" />
              Rarity Guide
            </div>
            <div className="mt-3 space-y-2 text-xs text-white/70">
              <div className="flex items-center justify-between rounded-full bg-slate-200/80 px-3 py-2 text-slate-900">
                <span>Common</span>
                <span>Foto jelek</span>
              </div>
              <div className="flex items-center justify-between rounded-full bg-sky-200/80 px-3 py-2 text-slate-900">
                <span>Rare</span>
                <span>Foto jeje ngasoy</span>
              </div>
              <div className="flex items-center justify-between rounded-full bg-pink-200/80 px-3 py-2 text-slate-900">
                <span>Epic</span>
                <span>Foto jeje cakeb</span>
              </div>
              <div className="flex items-center justify-between rounded-full bg-amber-200/90 px-3 py-2 text-amber-900">
                <span>Legendary</span>
                <span>Foto luar biasa jeje</span>
              </div>
              <div className="flex items-center justify-between rounded-full bg-violet-200/90 px-3 py-2 text-violet-900">
                <span>Mythic</span>
                <span>Foto bersama</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between text-sm font-semibold text-white">
              <span>Coin Collector</span>
              <span className="text-xs text-white/60">Tap 5x</span>
            </div>
            <p className="mt-2 text-xs text-white/60">
              Tangkap Sinterklas untuk dapat 1 koin tambahan.
            </p>
            <div
              ref={santaAreaRef}
              className="relative mt-4 h-40 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10"
            >
              <motion.button
                type="button"
                onClick={handleSantaTap}
                className="absolute flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-2xl"
                animate={{ x: santaPos.x, y: santaPos.y }}
                transition={{ type: "spring", stiffness: 120, damping: 14 }}
              >
                🎅
              </motion.button>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#38bdf8] to-[#a855f7]"
                initial={{ width: 0 }}
                animate={{ width: `${(tapProgress / 5) * 100}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onUnlockLetter}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#fcd34d] via-[#f59e0b] to-[#f472b6] px-6 py-4 text-base font-semibold text-[#3f1d2c] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Crown className="h-5 w-5" />
            Secret Gift
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {modalItem && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`w-full max-w-sm rounded-[28px] border border-white/20 bg-gradient-to-br ${RARITY_STYLES[modalItem.rarity]} p-5 shadow-[0_30px_60px_rgba(0,0,0,0.4)]`}
              initial={{ y: 40, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em]">
                <span>{RARITY_LABEL[modalItem.rarity]}</span>
                <span className="flex items-center gap-1 text-[0.6rem]">
                  <Star className="h-3 w-3" />
                  New Memory
                </span>
              </div>
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/40 bg-white/40">
                {/* Replace with your photo */}
                <img
                  src={modalItem.image}
                  alt={modalItem.title}
                  className="h-60 w-full object-cover"
                />
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <h3 className="text-lg font-semibold">{modalItem.title}</h3>
                <p>{modalItem.caption}</p>
              </div>
              <button
                onClick={() => setModalItem(null)}
                className="mt-5 w-full rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900"
              >
                Lanjut
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {fullScreenItem && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullScreenItem(null)}
          >
            <motion.div
              className="w-full max-w-3xl overflow-hidden rounded-2xl bg-black/40"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
            >
              <img
                src={fullScreenItem.image}
                alt={fullScreenItem.title}
                className="max-h-[80vh] w-full object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
