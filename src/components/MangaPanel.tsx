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
  const dragOffset = useRef({
    x: 0,
    y: 0,
  });

  const resizeStart = useRef({
    mouseX: 0,
    mouseY: 0,
    width: 0,
    height: 0,
  });

  // Start dragging the panel.
  function handlePointerDown(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    event.stopPropagation();

    onSelect();

    dragOffset.current = {
      x: event.clientX - panel.x,
      y: event.clientY - panel.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  // Move the panel while dragging.
  function handlePointerMove(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    const newX = event.clientX - dragOffset.current.x;
    const newY = event.clientY - dragOffset.current.y;

    onMove(panel.id, newX, newY);
  }

  // Stop dragging.
  function handlePointerUp(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  // Start resizing.
  function handleResizePointerDown(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    event.stopPropagation();

    resizeStart.current = {
      mouseX: event.clientX,
      mouseY: event.clientY,
      width: panel.width,
      height: panel.height,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  // Resize while the mouse moves.
  function handleResizePointerMove(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    const deltaX =
      event.clientX - resizeStart.current.mouseX;

    const deltaY =
      event.clientY - resizeStart.current.mouseY;

    const newWidth =
      resizeStart.current.width + deltaX;

    const newHeight =
      resizeStart.current.height + deltaY;

    onResize(panel.id, newWidth, newHeight);
  }

  // Stop resizing.
  function handleResizePointerUp(
    event: React.PointerEvent<HTMLDivElement>
  ) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`absolute cursor-move border-4 ${
        selected
          ? "border-blue-500 bg-blue-50"
          : "border-black bg-zinc-100"
      }`}
      style={{
        left: panel.x,
        top: panel.y,
        width: panel.width,
        height: panel.height,
        touchAction: "none",
      }}
    >
      {selected && (
        <div
          onPointerDown={handleResizePointerDown}
          onPointerMove={handleResizePointerMove}
          onPointerUp={handleResizePointerUp}
          className="absolute -bottom-2 -right-2 h-4 w-4 cursor-se-resize border-2 border-white bg-blue-500"
          style={{
            touchAction: "none",
          }}
        />
      )}
    </div>
  );
}