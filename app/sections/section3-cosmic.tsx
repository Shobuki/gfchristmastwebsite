"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Rocket, Sparkles, Telescope } from "lucide-react";

import { getPublicHeaders, withPublicToken } from "@/lib/public-api";

type CosmicProps = {
  onStartGame: () => void;
};

type NasaCard = {
  date: string;
  title: string;
  caption: string;
  image: string;
};

type JokeCard = {
  joke: string;
};

const DEFAULT_SETTINGS = {
  introTitle: "Our Journey through Time & Space",
  introSubtitle:
    "Kisah kita di antara bintang, nebula, dan jokes receh yang bikin kita ketawa.",
  timelineTitle: "The Emotional Rollercoaster",
  date1: "2023-05-20",
  caption1:
    "Di tanggal ini, semesta sibuk melihat nebula yang indah ini. Tapi di bumi, duniaku baru aja dimulai pas ketemu kamu.",
  date2: "2024-05-20",
  caption2:
    "Satu tahun kemudian, bintang ini mungkin udah bergeser. Tapi perasaanku ke kamu tetap di orbit yang sama.",
};

const FALLBACK_IMAGE = "https://placehold.co/400x600?text=Cosmic+Memory";
const NASA_API_KEY = process.env.NEXT_PUBLIC_NASA_API_KEY || "DEMO_KEY";

const glitchVariant = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    x: [0, -2, 2, -1, 1, 0],
    filter: [
      "drop-shadow(0 0 0 rgba(255,255,255,0))",
      "drop-shadow(2px 0 0 rgba(255,0,80,0.6))",
      "drop-shadow(-2px 0 0 rgba(0,255,255,0.6))",
      "drop-shadow(1px 0 0 rgba(255,255,255,0.2))",
    ],
    transition: { duration: 0.6 },
  },
};

export default function CosmicTimeline({ onStartGame }: CosmicProps) {
  const [stage, setStage] = useState<"intro" | "timeline">("intro");
  const [nasaCards, setNasaCards] = useState<NasaCard[]>([]);
  const [jokeCard, setJokeCard] = useState<JokeCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeImage, setActiveImage] = useState<NasaCard | null>(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const starField = useMemo(
    () =>
      Array.from({ length: 26 }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 1 + Math.random() * 2.5,
        opacity: 0.4 + Math.random() * 0.6,
        delay: Math.random() * 3,
        duration: 2 + Math.random() * 3,
      })),
    [],
  );

  useEffect(() => {
    if (stage !== "timeline") return;
    let isMounted = true;
    setLoading(true);

    const fetchNasa = async (date: string, caption: string) => {
      try {
        const res = await fetch(
          `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&date=${date}`,
        );
        const data = await res.json();
        const image =
          data?.media_type === "image" ? data.hdurl || data.url : FALLBACK_IMAGE;
        return {
          date,
          title: data?.title || "Cosmic Memory",
          caption,
          image: image || FALLBACK_IMAGE,
        };
      } catch {
        return {
          date,
          title: "Cosmic Memory",
          caption,
          image: FALLBACK_IMAGE,
        };
      }
    };

    const fetchJoke = async () => {
      try {
        const res = await fetch("https://icanhazdadjoke.com/", {
          headers: { Accept: "application/json" },
        });
        const data = await res.json();
        return { joke: data?.joke || "Dad joke gagal kebaca." };
      } catch {
        return { joke: "Dad joke gagal kebaca." };
      }
    };

    const loadSettings = async () => {
      try {
        const res = await fetch(withPublicToken("/api/cosmic"), {
          headers: getPublicHeaders(),
        });
        const data = await res.json();
        if (data?.item) {
          setSettings({
            introTitle: data.item.intro_title,
            introSubtitle: data.item.intro_subtitle,
            timelineTitle: data.item.timeline_title,
            date1: data.item.date1,
            caption1: data.item.caption1,
            date2: data.item.date2,
            caption2: data.item.caption2,
          });
          return data.item;
        }
      } catch {
        // ignore fetch errors
      }
      return null;
    };

    const run = async () => {
      const config = (await loadSettings()) || {
        date1: settings.date1,
        caption1: settings.caption1,
        date2: settings.date2,
        caption2: settings.caption2,
      };

      const [first, second, joke] = await Promise.all([
        fetchNasa(config.date1, config.caption1),
        fetchNasa(config.date2, config.caption2),
        fetchJoke(),
      ]);
      if (!isMounted) return;
      setNasaCards([first, second]);
      setJokeCard(joke);
    };

    run().finally(() => {
      if (!isMounted) return;
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [stage]);

  return (
    <motion.main
      key="cosmic"
      className="relative z-20 min-h-screen overflow-hidden bg-gradient-to-b from-[#05070f] via-[#0b1230] to-[#2a1238] px-5 pb-10 pt-10 text-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.6 }}
    >
      <div className="pointer-events-none absolute inset-0">
        {starField.map((star) => (
          <motion.span
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
            animate={{ opacity: [star.opacity, 0.1, star.opacity] }}
            transition={{
              duration: star.duration,
              repeat: Infinity,
              delay: star.delay,
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {stage === "intro" && (
          <motion.div
            key="intro"
            className="relative z-10 flex min-h-[80vh] flex-col items-center justify-center text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-[#facc15]">
              <Telescope className="h-7 w-7" />
            </div>
            <h2 className="text-3xl font-semibold [font-family:var(--font-display)]">
              {settings.introTitle}
            </h2>
            <p className="mt-3 max-w-xs text-sm text-white/70">
              {settings.introSubtitle}
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setStage("timeline")}
              className="mt-8 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f472b6] via-[#a855f7] to-[#6366f1] px-6 py-3 text-sm font-semibold text-white"
            >
              <Rocket className="h-4 w-4" />
              Mulai Perjalanan Kita
            </motion.button>
          </motion.div>
        )}

        {stage === "timeline" && (
          <motion.div
            key="timeline"
            className="relative z-10 space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <header className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Cosmic Timeline
                </p>
                <h2 className="text-2xl font-semibold [font-family:var(--font-display)]">
                  {settings.timelineTitle}
                </h2>
              </div>
              <Sparkles className="h-6 w-6 text-[#fcd34d]" />
            </header>

            {loading && (
              <div className="flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-8 text-sm text-white/70">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengambil sinyal dari NASA...
              </div>
            )}

            {!loading && (
              <div className="grid grid-cols-2 gap-3">
                {nasaCards.map((card) => (
                  <motion.button
                    key={card.date}
                    type="button"
                    className="group relative aspect-[3/4] overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-left shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    onClick={() => setActiveImage(card)}
                  >
                    <div className="relative">
                      {/* Replace with your NASA image if needed */}
                      <img
                        src={card.image || FALLBACK_IMAGE}
                        alt={card.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-90 transition group-hover:opacity-100" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 space-y-1 p-3 text-[11px] text-white/90">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">
                        {card.date}
                      </p>
                      <h3 className="text-sm font-semibold text-white">
                        {card.title}
                      </h3>
                      <p className="text-white/80">{card.caption}</p>
                    </div>
                  </motion.button>
                ))}

                <motion.article
                  {...glitchVariant}
                  className="relative overflow-hidden rounded-3xl border border-rose-300/40 bg-black/70 p-4 text-sm"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(255,255,255,0.04)_50%)] [background-size:100%_6px]" />
                  <div className="relative z-10 space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-rose-200">
                      Reality Check
                    </p>
                    <h3 className="text-base font-semibold text-white">
                      {jokeCard?.joke || "Dad joke loading..."}
                    </h3>
                    <p className="text-white/70">
                      Meanwhile, realita hubungan kita isinya jokes garing kayak
                      gini. Tapi anehnya aku sayang.
                    </p>
                  </div>
                </motion.article>
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onStartGame}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#38bdf8] via-[#22d3ee] to-[#a855f7] px-6 py-4 text-sm font-semibold text-[#070a1a]"
            >
              <Rocket className="h-4 w-4" />
              Misi Selanjutnya: Menuju Planet Christmas
            </motion.button>

            <motion.div
              className={`fixed inset-0 z-40 flex items-center justify-center bg-black/80 px-4 ${
                activeImage
                  ? "pointer-events-auto"
                  : "pointer-events-none opacity-0"
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
                    src={activeImage.image || FALLBACK_IMAGE}
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
