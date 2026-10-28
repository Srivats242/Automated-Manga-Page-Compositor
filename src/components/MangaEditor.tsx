
"use client";

import { useRef, useState } from "react";
import type { MangaPanel as MangaPanelType } from "../types/manga";
import MangaPanel from "./MangaPanel";

const PAGE_WIDTH = 600;
const PAGE_HEIGHT = 850;
const MIN_SIZE = 50;

export default function MangaEditor() {
  const [panels, setPanels] = useState<MangaPanelType[]>([]);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedPanel = panels.find(
    (panel) => panel.id === selectedPanelId
  );

  function addPanel() {
    const newPanel: MangaPanelType = {
      id: crypto.randomUUID(),
      x: 50,
      y: 50,
      width: 250,
      height: 180,
    };

    setPanels((current) => [...current, newPanel]);
    setSelectedPanelId(newPanel.id);
  }

  function updatePanel(
    id: string,
    changes: Partial<MangaPanelType>
  ) {
    setPanels((current) =>
      current.map((panel) => {
        if (panel.id !== id) return panel;

        const updated = { ...panel, ...changes };

        const width = Math.max(
          MIN_SIZE,
          Math.min(updated.width, PAGE_WIDTH)
        );

        const height = Math.max(
          MIN_SIZE,
          Math.min(updated.height, PAGE_HEIGHT)
        );

        const x = Math.max(
          0,
          Math.min(updated.x, PAGE_WIDTH - width)
        );

        const y = Math.max(
          0,
          Math.min(updated.y, PAGE_HEIGHT - height)
        );

        return { ...updated, x, y, width, height };
      })
    );
  }

  function movePanel(id: string, x: number, y: number) {
    updatePanel(id, { x, y });
  }

  function resizePanel(
    id: string,
    width: number,
    height: number
  ) {
    setPanels((current) =>
      current.map((panel) => {
        if (panel.id !== id) return panel;

        return {
          ...panel,
          width: Math.max(
            MIN_SIZE,
            Math.min(width, PAGE_WIDTH - panel.x)
          ),
          height: Math.max(
            MIN_SIZE,
            Math.min(height, PAGE_HEIGHT - panel.y)
          ),
        };
      })
    );
  }

  function deletePanel() {
    if (!selectedPanelId) return;

    setPanels((current) =>
      current.filter((panel) => panel.id !== selectedPanelId)
    );

    setSelectedPanelId(null);
  }

  function duplicatePanel() {
    if (!selectedPanel) return;

    const copy: MangaPanelType = {
      ...selectedPanel,
      id: crypto.randomUUID(),
      x: Math.min(
        selectedPanel.x + 20,
        PAGE_WIDTH - selectedPanel.width
      ),
      y: Math.min(
        selectedPanel.y + 20,
        PAGE_HEIGHT - selectedPanel.height
      ),
    };

    setPanels((current) => [...current, copy]);
    setSelectedPanelId(copy.id);
  }

  function uploadImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selectedPanelId) return;

    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      alert("Please upload a PNG, JPG, or WebP image.");
      event.target.value = "";
      return;
    }

    const panelId = selectedPanelId;
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        updatePanel(panelId, { image: reader.result });
      }
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function removeImage() {
    if (!selectedPanelId) return;
    updatePanel(selectedPanelId, { image: undefined });
  }

  return (
    <main className="min-h-screen bg-zinc-900 text-white">
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
        <aside className="w-56 border-r border-zinc-700 bg-zinc-800 p-4">
          <h2 className="mb-4 font-semibold">Tools</h2>
          <p className="text-sm text-zinc-400">
            Panels: {panels.length}
          </p>
        </aside>

        <section className="flex flex-1 items-start justify-center overflow-auto bg-zinc-700 p-10">
          <div
            className="relative shrink-0 bg-white shadow-2xl"
            style={{
              width: PAGE_WIDTH,
              height: PAGE_HEIGHT,
            }}
            onPointerDown={() => setSelectedPanelId(null)}
          >
            {panels.map((panel) => (
              <MangaPanel
                key={panel.id}
                panel={panel}
                selected={selectedPanelId === panel.id}
                onSelect={() => setSelectedPanelId(panel.id)}
                onMove={movePanel}
                onResize={resizePanel}
              />
            ))}
          </div>
        </section>

        <aside className="w-64 shrink-0 border-l border-zinc-700 bg-zinc-800 p-4">
          <h2 className="mb-5 font-semibold">Properties</h2>

          {selectedPanel ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">
                Selected Panel
              </p>

              {(
                ["x", "y", "width", "height"] as const
              ).map((property) => (
                <label
                  key={property}
                  className="block text-sm capitalize"
                >
                  {property}
                  <input
                    type="number"
                    min={0}
                    max={
                      property === "x" || property === "width"
                        ? PAGE_WIDTH
                        : PAGE_HEIGHT
                    }
                    value={selectedPanel[property]}
                    onChange={(event) => {
                      const value = event.target.valueAsNumber;
                      if (!Number.isFinite(value)) return;

                      updatePanel(selectedPanel.id, {
                        [property]: value,
                      });
                    }}
                    className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-white"
                  />
                </label>
              ))}

              <div className="border-t border-zinc-600 pt-4">
                <h3 className="mb-3 font-medium">Artwork</h3>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={uploadImage}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-700"
                >
                  {selectedPanel.image
                    ? "Replace Artwork"
                    : "Upload Artwork"}
                </button>

                {selectedPanel.image && (
                  <button
                    onClick={removeImage}
                    className="mt-2 w-full rounded bg-zinc-600 px-4 py-2 hover:bg-zinc-500"
                  >
                    Remove Artwork
                  </button>
                )}
              </div>

              <button
                onClick={duplicatePanel}
                className="w-full rounded bg-blue-600 px-4 py-2 hover:bg-blue-700"
              >
                Duplicate Panel
              </button>

              <button
                onClick={deletePanel}
                className="w-full rounded bg-red-600 px-4 py-2 hover:bg-red-700"
              >
                Delete Panel
              </button>
            </div>
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
