
"use client";

import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { MangaPanel as MangaPanelType } from "../types/manga";

type Props = {
  panel: MangaPanelType;
  selected: boolean;
  onSelect: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onMoveArtwork: (id: string, x: number, y: number) => void;
};

export default function MangaPanel({
  panel,
  selected,
  onSelect,
  onMove,
  onResize,
  onMoveArtwork,
}: Props) {
  const dragStart = useRef<{
    pointerX: number;
    pointerY: number;
    x: number;
    y: number;
    mode: "panel" | "artwork";
  } | null>(null);

  const resizeStart = useRef<{
    pointerX: number;
    pointerY: number;
    width: number;
    height: number;
  } | null>(null);

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    event.stopPropagation();
    onSelect();

    const mode =
      panel.image && panel.imageMode === "artwork"
        ? "artwork"
        : "panel";

    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: mode === "artwork" ? panel.imageX : panel.x,
      y: mode === "artwork" ? panel.imageY : panel.y,
      mode,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function drag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;

    const dx = event.clientX - dragStart.current.pointerX;
    const dy = event.clientY - dragStart.current.pointerY;

    if (dragStart.current.mode === "artwork") {
      onMoveArtwork(
        panel.id,
        dragStart.current.x + dx,
        dragStart.current.y + dy
      );
    } else {
      onMove(
        panel.id,
        dragStart.current.x + dx,
        dragStart.current.y + dy
      );
    }
  }

  function stopDrag() {
    dragStart.current = null;
  }

  function startResize(event: ReactPointerEvent<HTMLDivElement>) {
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

  function resize(event: ReactPointerEvent<HTMLDivElement>) {
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
      className={`absolute border-2 ${
        selected ? "border-blue-500" : "border-black"
      }`}
      style={{
        left: panel.x,
        top: panel.y,
        width: panel.width,
        height: panel.height,
        touchAction: "none",
        cursor:
          panel.image && panel.imageMode === "artwork"
            ? "grab"
            : "move",
      }}
    >
      <div className="relative h-full w-full overflow-hidden bg-white">
        {panel.image ? (
          <img
            src={panel.image}
            alt="Manga panel artwork"
            draggable={false}
            className="absolute h-full w-full select-none object-cover"
            style={{
              left: panel.imageX,
              top: panel.imageY,
              transform: `scale(${panel.imageScale})`,
              transformOrigin: "center center",
              pointerEvents: "none",
            }}
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
