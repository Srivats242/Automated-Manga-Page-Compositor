export type BubbleShape = "oval" | "rectangle" | "thought";

export type SpeechBubble = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;

  shape?: BubbleShape;
  showTail?: boolean;
  textAlign?: "left" | "center" | "right";
  bold?: boolean;
  italic?: boolean;
  borderWidth?: number;
  borderColor?: string;
};
