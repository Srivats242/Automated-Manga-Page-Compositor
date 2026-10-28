
export type MangaPanel = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  image?: string;
  imageX: number;
  imageY: number;
  imageScale: number;
  imageMode: "panel" | "artwork";
};
