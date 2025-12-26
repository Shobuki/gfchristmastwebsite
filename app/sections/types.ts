export type AppState =
  | "LOCKED"
  | "JOURNEY"
  | "COSMIC"
  | "LOVE_RADAR"
  | "GAME"
  | "GACHA"
  | "LETTER";
export type ItemType = "good" | "bad";

export type FallingItem = {
  id: number;
  type: ItemType;
  emoji: string;
  x: number;
  y: number;
  speed: number;
};
