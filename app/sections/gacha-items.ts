export type Rarity = "common" | "rare" | "legendary";

export type GachaItem = {
  id: number;
  rarity: Rarity;
  title: string;
  caption: string;
  image: string;
};

export const GACHA_ITEMS: GachaItem[] = [
  {
    id: 1,
    rarity: "common",
    title: "Selfie Blur",
    caption: "Foto blur tapi tetep bikin ketawa.",
    image: "https://placehold.co/400x600?text=Common+1",
  },
  {
    id: 2,
    rarity: "common",
    title: "Muka Ngantuk",
    caption: "Ekspresi paling lucu pas nunggu pesanan.",
    image: "https://placehold.co/400x600?text=Common+2",
  },
  {
    id: 3,
    rarity: "common",
    title: "Pose Aneh",
    caption: "Pose random yang malah jadi favorit.",
    image: "https://placehold.co/400x600?text=Common+3",
  },
  {
    id: 4,
    rarity: "common",
    title: "Candid Chaos",
    caption: "Momen konyol yang bikin ketawa terus.",
    image: "https://placehold.co/400x600?text=Common+4",
  },
  {
    id: 5,
    rarity: "rare",
    title: "Dinner Date",
    caption: "Makan enak sambil ketawa bareng.",
    image: "https://placehold.co/400x600?text=Rare+1",
  },
  {
    id: 6,
    rarity: "rare",
    title: "Trip Singkat",
    caption: "Jalan-jalan kecil yang selalu bikin rindu.",
    image: "https://placehold.co/400x600?text=Rare+2",
  },
  {
    id: 7,
    rarity: "rare",
    title: "Coffee Break",
    caption: "Momen santai favorit kita.",
    image: "https://placehold.co/400x600?text=Rare+3",
  },
  {
    id: 8,
    rarity: "legendary",
    title: "First Date",
    caption: "Hari pertama yang bikin semuanya dimulai.",
    image: "https://placehold.co/400x600?text=Legendary+1",
  },
  {
    id: 9,
    rarity: "legendary",
    title: "Anniversary Night",
    caption: "Momen paling romantis kita.",
    image: "https://placehold.co/400x600?text=Legendary+2",
  },
  {
    id: 10,
    rarity: "legendary",
    title: "Christmas Kiss",
    caption: "Hadiah terbaik di malam Natal.",
    image: "https://placehold.co/400x600?text=Legendary+3",
  },
];
