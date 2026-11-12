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
  onEditStart: () => void;
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
  onEditStart,
}: Props) {
  const dragStart = useRef<PointerStart | null>(null);
  const resizeStart = useRef<PointerStart | null>(null);
  const historyRecorded = useRef(false);

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    onSelect();
    historyRecorded.current = false;

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

    if (
      !historyRecorded.current &&
      Math.hypot(dx, dy) < 4
    ) {
      return;
    }

    if (!historyRecorded.current) {
      onEditStart();
      historyRecorded.current = true;
    }

    onMove(
      bubble.id,
      dragStart.current.x + dx,
      dragStart.current.y + dy
    );
  }

  function startResize(event: ReactPointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    onSelect();
    historyRecorded.current = false;

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

    if (
      !historyRecorded.current &&
      Math.hypot(dx, dy) < 4
    ) {
      return;
    }

    if (!historyRecorded.current) {
      onEditStart();
      historyRecorded.current = true;
    }

    onResize(
      bubble.id,
      resizeStart.current.width + dx,
      resizeStart.current.height + dy
    );
  }

  const shape = bubble.shape ?? "oval";
  const borderColor = bubble.borderColor ?? "#000000";
  const borderWidth = bubble.borderWidth ?? 2;

  const borderRadius =
    shape === "rectangle" ? "12px" : "50%";

  return (
    <div
      onPointerDown={startDrag}
      onPointerMove={drag}
      onPointerUp={() => {
        dragStart.current = null;
        historyRecorded.current = false;
      }}
      onPointerCancel={() => {
        dragStart.current = null;
        historyRecorded.current = false;
      }}
      className="absolute z-20 flex select-none items-center justify-center bg-white p-4 text-black"
      style={{
        left: bubble.x,
        top: bubble.y,
        width: bubble.width,
        height: bubble.height,
        border: `${borderWidth}px ${
          shape === "thought" ? "dashed" : "solid"
        } ${borderColor}`,
        borderRadius,
        outline: selected ? "2px solid #3b82f6" : "none",
        cursor: "move",
        touchAction: "none",
      }}
    >
      <span
        className="relative z-10 w-full break-words leading-tight"
        style={{
          fontSize: bubble.fontSize,
          textAlign: bubble.textAlign ?? "center",
          fontWeight: bubble.bold ? "bold" : "normal",
          fontStyle: bubble.italic ? "italic" : "normal",
          overflowWrap: "anywhere",
          whiteSpace: "pre-wrap",
        }}
      >
        {bubble.text}
      </span>

      {bubble.showTail && (
        <svg
          className="pointer-events-none absolute left-1/2 top-full h-8 w-12 -translate-x-1/2 overflow-visible"
          viewBox="0 0 48 32"
          aria-hidden="true"
        >
          <path
            d="M8 0 L24 28 L34 0"
            fill="white"
            stroke={borderColor}
            strokeWidth={borderWidth}
            strokeLinejoin="round"
          />
          <path
            d="M9 0 L33 0"
            stroke="white"
            strokeWidth={borderWidth + 3}
          />
        </svg>
      )}

      {selected && (
        <div
          onPointerDown={startResize}
          onPointerMove={resize}
          onPointerUp={(event) => {
            event.stopPropagation();
            resizeStart.current = null;
            historyRecorded.current = false;
          }}
          onPointerCancel={(event) => {
            event.stopPropagation();
            resizeStart.current = null;
            historyRecorded.current = false;
          }}
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
