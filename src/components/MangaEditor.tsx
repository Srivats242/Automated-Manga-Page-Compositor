"use client";

import { useState } from "react";
import type { MangaPanel as MangaPanelType } from "../types/manga";
import MangaPanel from "./MangaPanel";

const PAGE_WIDTH = 600;
const PAGE_HEIGHT = 850;

export default function MangaEditor() {
  const [panels, setPanels] = useState<MangaPanelType[]>([]);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);

  function addPanel() {
    const newPanel: MangaPanelType = {
      id: crypto.randomUUID(),
      x: 50,
      y: 50,
      width: 250,
      height: 180,
    };

    setPanels((currentPanels) => [...currentPanels, newPanel]);
    setSelectedPanelId(newPanel.id);
  }

  function movePanel(id: string, x: number, y: number) {
    setPanels((currentPanels) =>
      currentPanels.map((panel) => {
        if (panel.id !== id) {
          return panel;
        }

        // Prevent the panel from being dragged outside the page.
        const boundedX = Math.max(
          0,
          Math.min(x, PAGE_WIDTH - panel.width)
        );

        const boundedY = Math.max(
          0,
          Math.min(y, PAGE_HEIGHT - panel.height)
        );

        return {
          ...panel,
          x: boundedX,
          y: boundedY,
        };
      })
    );
  }

  function resizePanel(
    id: string,
    width: number,
    height: number
  ) {
    setPanels((currentPanels) =>
      currentPanels.map((panel) => {
        if (panel.id !== id) {
          return panel;
        }

        const minWidth = 50;
        const minHeight = 50;

        // Maximum size depends on the panel's current position.
        const maxWidth = PAGE_WIDTH - panel.x;
        const maxHeight = PAGE_HEIGHT - panel.y;

        const boundedWidth = Math.max(
          minWidth,
          Math.min(width, maxWidth)
        );

        const boundedHeight = Math.max(
          minHeight,
          Math.min(height, maxHeight)
        );

        return {
          ...panel,
          width: boundedWidth,
          height: boundedHeight,
        };
      })
    );
  }

  return (
    <main className="min-h-screen bg-zinc-900 text-white">
      {/* Top toolbar */}
      <header className="flex h-16 items-center justify-between border-b border-zinc-700 px-6">
        <h1 className="text-xl font-bold">
          Manga Compositor
        </h1>

        <button
          onClick={addPanel}
          className="rounded bg-white px-4 py-2 font-medium text-black hover:bg-zinc-200"
        >
          Add Panel
        </button>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Left sidebar */}
        <aside className="w-56 border-r border-zinc-700 bg-zinc-800 p-4">
          <h2 className="mb-4 font-semibold">
            Tools
          </h2>

          <p className="text-sm text-zinc-400">
            Panels: {panels.length}
          </p>
        </aside>

        {/* Editor workspace */}
        <section className="flex flex-1 items-start justify-center overflow-auto bg-zinc-700 p-10">
          {/* Manga page */}
          <div
            className="relative bg-white shadow-2xl"
            style={{
              width: `${PAGE_WIDTH}px`,
              height: `${PAGE_HEIGHT}px`,
            }}
            onPointerDown={() => setSelectedPanelId(null)}
          >
            {panels.map((panel) => (
              <MangaPanel
                key={panel.id}
                panel={panel}
                selected={selectedPanelId === panel.id}
                onSelect={() =>
                  setSelectedPanelId(panel.id)
                }
                onMove={movePanel}
                onResize={resizePanel}
              />
            ))}
          </div>
        </section>

        {/* Right sidebar */}
        <aside className="w-64 border-l border-zinc-700 bg-zinc-800 p-4">
          <h2 className="mb-4 font-semibold">
            Properties
          </h2>

          {selectedPanelId ? (
            <p className="text-sm text-zinc-300">
              Panel selected
            </p>
          ) : (
            <p className="text-sm text-zinc-400">
              Select a panel to edit its properties.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}