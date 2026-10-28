
"use client";

import { useRef } from "react";
import type { MangaPanel as MangaPanelType } from "../types/manga";

type Props = {
  panel: MangaPanelType;
  selected: boolean;
  onSelect: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
};

export default function MangaPanel({
  panel,
  selected,
  onSelect,
  onMove,
  onResize,
}: Props) {
  const dragStart = useRef<{
    pointerX: number;
    pointerY: number;
    x: number;
    y: number;
  } | null>(null);

  const resizeStart = useRef<{
    pointerX: number;
    pointerY: number;
    width: number;
    height: number;
  } | null>(null);

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    onSelect();

    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: panel.x,
      y: panel.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function drag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;

    const dx = event.clientX - dragStart.current.pointerX;
    const dy = event.clientY - dragStart.current.pointerY;

    onMove(
      panel.id,
      dragStart.current.x + dx,
      dragStart.current.y + dy
    );
  }

  function stopDrag() {
    dragStart.current = null;
  }

  function startResize(event: React.PointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    onSelect();

    resizeStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      width: panel.width,
      height: panel.height,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function resize(event: React.PointerEvent<HTMLDivElement>) {
    event.stopPropagation();

    if (!resizeStart.current) return;

    const dx = event.clientX - resizeStart.current.pointerX;
    const dy = event.clientY - resizeStart.current.pointerY;

    onResize(
      panel.id,
      resizeStart.current.width + dx,
      resizeStart.current.height + dy
    );
  }

  function stopResize(event: React.PointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    resizeStart.current = null;
  }

  return (
    <div
      onPointerDown={startDrag}
      onPointerMove={drag}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      className={`absolute overflow-visible border-2 ${
        selected ? "border-blue-500" : "border-black"
      }`}
      style={{
        left: panel.x,
        top: panel.y,
        width: panel.width,
        height: panel.height,
        touchAction: "none",
        cursor: "move",
      }}
    >
      <div className="h-full w-full overflow-hidden bg-white">
        {panel.image ? (
          <img
            src={panel.image}
            alt="Manga panel artwork"
            draggable={false}
            className="h-full w-full select-none object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            Empty Panel
          </div>
        )}
      </div>

      {selected && (
        <div
          onPointerDown={startResize}
          onPointerMove={resize}
          onPointerUp={stopResize}
          onPointerCancel={stopResize}
          className="absolute -bottom-2 -right-2 z-10 h-4 w-4 cursor-nwse-resize rounded-sm bg-blue-500"
          style={{ touchAction: "none" }}
        />
      )}
    </div>
  );
}
