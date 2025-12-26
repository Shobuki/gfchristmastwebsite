"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, PartyPopper } from "lucide-react";

import { getPublicHeaders, withPublicToken } from "@/lib/public-api";

type LetterSettings = {
  title: string;
  body1: string;
  body2: string;
  buttonText: string;
  footer: string;
};

type LetterProps = {
  onBackToGacha: () => void;
};

const DEFAULT_LETTER: LetterSettings = {
  title: "Untukmu, Sayang",
  body1:
    "Placeholder love letter. Tulis di sini semua hal yang bikin kamu bersyukur bertemu dia, bagaimana dia membuat harimu hangat, dan rencana kecil kalian untuk tahun berikutnya.",
  body2:
    "Tambahkan detail tentang momen Natal, aroma cokelat panas, dan betapa spesialnya ulang tahun ini karena dia ada di sisimu.",
  buttonText: "Redeem Gift",
  footer: "Merry Christmas & Happy Anniversary",
};

export default function Letter({ onBackToGacha }: LetterProps) {
  const [letter, setLetter] = useState<LetterSettings>(DEFAULT_LETTER);

  useEffect(() => {
    const fetchLetter = async () => {
      try {
        const res = await fetch(withPublicToken("/api/letter"), {
          headers: getPublicHeaders(),
        });
        const data = await res.json();
        if (data?.item) {
          setLetter({
            title: data.item.title || DEFAULT_LETTER.title,
            body1: data.item.body1 || DEFAULT_LETTER.body1,
            body2: data.item.body2 || DEFAULT_LETTER.body2,
            buttonText: data.item.button_text || DEFAULT_LETTER.buttonText,
            footer: data.item.footer || DEFAULT_LETTER.footer,
          });
        }
      } catch {
        // Ignore fetch errors and keep defaults.
      }
    };
    fetchLetter();
  }, []);

  return (
    <motion.main
      key="letter"
      className="relative z-20 min-h-screen bg-[#f6efe6] px-5 pb-12 pt-10 text-[#5b3b2f]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mx-auto w-full max-w-md rounded-[28px] border border-[#e8d6c3] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(248,239,230,0.9),_rgba(236,219,202,0.95))] p-6 shadow-[0_30px_60px_rgba(120,90,70,0.25)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-3xl font-semibold [font-family:var(--font-display)]">
            {letter.title}
          </h2>
          <Heart className="h-6 w-6 text-[#c46a6a]" />
        </div>
        <p className="mb-4 text-sm leading-6">{letter.body1}</p>
        <p className="mb-6 text-sm leading-6">{letter.body2}</p>
        <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#c96b6b] via-[#d88973] to-[#e5a073] px-6 py-4 text-base font-semibold text-white">
          <PartyPopper className="h-5 w-5" />
          {letter.buttonText}
        </button>
        <button
          type="button"
          onClick={onBackToGacha}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-[#d9b9a6] bg-white/70 px-6 py-3 text-sm font-semibold text-[#6b4a3d]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Gacha
        </button>
        {letter.footer ? (
          <p className="mt-4 text-center text-xs text-[#8c6b5e]">
            {letter.footer}
          </p>
        ) : null}
      </div>
    </motion.main>
  );
}
