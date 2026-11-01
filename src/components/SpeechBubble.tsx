"use client";

import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { SpeechBubble as SpeechBubbleType } from "../types/speechBubble";

type Props = {
  bubble: SpeechBubbleType;
  selected: boolean;
  onSelect: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
};

type PointerStart = {
  pointerX: number;
  pointerY: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function SpeechBubble({
  bubble,
  selected,
  onSelect,
  onMove,
  onResize,
}: Props) {
  const dragStart = useRef<PointerStart | null>(null);
  const resizeStart = useRef<PointerStart | null>(null);

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    onSelect();

    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: bubble.x,
      y: bubble.y,
      width: bubble.width,
      height: bubble.height,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function drag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;

    const dx = event.clientX - dragStart.current.pointerX;
    const dy = event.clientY - dragStart.current.pointerY;

    onMove(
      bubble.id,
      dragStart.current.x + dx,
      dragStart.current.y + dy
    );
  }

  function startResize(event: ReactPointerEvent<HTMLDivElement>) {
    event.stopPropagation();

    resizeStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: bubble.x,
      y: bubble.y,
      width: bubble.width,
      height: bubble.height,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function resize(event: ReactPointerEvent<HTMLDivElement>) {
    if (!resizeStart.current) return;

    event.stopPropagation();

    const dx = event.clientX - resizeStart.current.pointerX;
    const dy = event.clientY - resizeStart.current.pointerY;

    onResize(
      bubble.id,
      resizeStart.current.width + dx,
      resizeStart.current.height + dy
    );
  }

  function stopDrag() {
    dragStart.current = null;
  }

  function stopResize(event: ReactPointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    resizeStart.current = null;
  }

  return (
    <div
      onPointerDown={startDrag}
      onPointerMove={drag}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      className={`absolute z-20 flex items-center justify-center rounded-[50%] border-2 bg-white p-4 text-center text-black ${
        selected ? "border-blue-500" : "border-black"
      }`}
      style={{
        left: bubble.x,
        top: bubble.y,
        width: bubble.width,
        height: bubble.height,
        cursor: "move",
        touchAction: "none",
      }}
    >
      <span
        className="w-full break-words font-semibold leading-tight"
        style={{
          fontSize: bubble.fontSize,
          overflowWrap: "anywhere",
        }}
      >
        {bubble.text}
      </span>

      {selected && (
        <div
          onPointerDown={startResize}
          onPointerMove={resize}
          onPointerUp={stopResize}
          onPointerCancel={stopResize}
          className="absolute -bottom-2 -right-2 z-30 h-4 w-4 rounded-sm border border-white bg-blue-500"
          style={{
            cursor: "nwse-resize",
            touchAction: "none",
          }}
        />
      )}
    </div>
  );
}
