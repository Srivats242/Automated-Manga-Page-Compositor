
"use client";

import { useRef, useState } from "react";
import type { MangaPanel as MangaPanelType } from "../types/manga";
import MangaPanel from "./MangaPanel";

const PAGE_WIDTH = 600;
const PAGE_HEIGHT = 850;
const MIN_SIZE = 50;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}


function clampRound(value: number, min: number, max: number) {
  return Math.round(clamp(value, min, max));
}


function constrainArtwork(panel: MangaPanelType): MangaPanelType {
  if (!panel.image) return panel;

  const scale = clamp(panel.imageScale, 1, 3);

  const maxX = (panel.width * (scale - 1)) / 2;
  const maxY = (panel.height * (scale - 1)) / 2;

  return {
    ...panel,
    imageScale: scale,
    imageX: clampRound(panel.imageX, -maxX, maxX),
    imageY: clampRound(panel.imageY, -maxY, maxY),
  };
}

export default function MangaEditor() {
  const [panels, setPanels] = useState<MangaPanelType[]>([]);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedPanel = panels.find(
    (panel) => panel.id === selectedPanelId
  );

  const maxImageX = selectedPanel
  ? (selectedPanel.width * (selectedPanel.imageScale - 1)) / 2
  : 0;

const maxImageY = selectedPanel
  ? (selectedPanel.height * (selectedPanel.imageScale - 1)) / 2
  : 0;

  function addPanel() {
    const newPanel: MangaPanelType = {
      id: crypto.randomUUID(),
      x: 50,
      y: 50,
      width: 250,
      height: 180,
      imageX: 0,
      imageY: 0,
      imageScale: 1,
      imageMode: "panel",
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

        const width = clampRound(updated.width, MIN_SIZE, PAGE_WIDTH);
        const height = clampRound(updated.height, MIN_SIZE, PAGE_HEIGHT);
        const x = clampRound(updated.x, 0, PAGE_WIDTH - width);
        const y = clampRound(updated.y, 0, PAGE_HEIGHT - height);

        return constrainArtwork({
          ...updated,
          x,
          y,
          width,
          height,
        });
      })
    );
  }

  function movePanel(id: string, x: number, y: number) {
    updatePanel(id, { x, y });
  }

  function moveArtwork(id: string, x: number, y: number) {
    updatePanel(id, { imageX: x, imageY: y });
  }

  function resizePanel(
    id: string,
    width: number,
    height: number
  ) {
    setPanels((current) =>
      current.map((panel) => {
        if (panel.id !== id) return panel;

        const updated = {
          ...panel,
          width: clampRound(
            width,
            MIN_SIZE,
            PAGE_WIDTH - panel.x
          ),
          height: clampRound(
            height,
            MIN_SIZE,
            PAGE_HEIGHT - panel.y
          ),
        };

        return constrainArtwork(updated);
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
        updatePanel(panelId, {
          image: reader.result,
          imageX: 0,
          imageY: 0,
          imageScale: 1,
          imageMode: "artwork",
        });
      }
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function removeImage() {
    if (!selectedPanelId) return;

    updatePanel(selectedPanelId, {
      image: undefined,
      imageX: 0,
      imageY: 0,
      imageScale: 1,
      imageMode: "panel",
    });
  }

  function resetCrop() {
    if (!selectedPanelId) return;

    updatePanel(selectedPanelId, {
      imageX: 0,
      imageY: 0,
      imageScale: 1,
    });
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
                onMoveArtwork={moveArtwork}
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
                  <div className="mt-4 space-y-4">
                    <label className="block text-sm">
                      Drag Mode
                      <select
                        value={selectedPanel.imageMode}
                        onChange={(event) =>
                          updatePanel(selectedPanel.id, {
                            imageMode: event.target.value as
                              | "panel"
                              | "artwork",
                          })
                        }
                        className="mt-2 w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-white"
                      >
                        <option value="panel">Move Panel</option>
                        <option value="artwork">Move Artwork</option>
                      </select>
                    </label>

                    
                    <label className="block text-sm">
                      Image X
                      <input
                        type="range"
                        min={-maxImageX}
                        max={maxImageX}
                        step={1}
                        value={selectedPanel.imageX}
                        disabled={maxImageX === 0}
                        onChange={(event) =>
                          updatePanel(selectedPanel.id, {
                            imageX: Number(event.target.value),
                          })
                        }
                        className="mt-2 w-full disabled:opacity-50"
                      />
                      <span className="text-xs text-zinc-400">
                        {Math.round(selectedPanel.imageX)}px
                        {" / "}
                        ±{Math.round(maxImageX)}px
                      </span>
                    </label>


                  
                    <label className="block text-sm">
                      Image Y
                      <input
                        type="range"
                        min={-maxImageY}
                        max={maxImageY}
                        step={1}
                        value={selectedPanel.imageY}
                        disabled={maxImageY === 0}
                        onChange={(event) =>
                          updatePanel(selectedPanel.id, {
                            imageY: Number(event.target.value),
                          })
                        }
                        className="mt-2 w-full disabled:opacity-50"
                      />
                      <span className="text-xs text-zinc-400">
                        {Math.round(selectedPanel.imageY)}px
                        {" / "}
                        ±{Math.round(maxImageY)}px
                      </span>
                    </label>


                    <label className="block text-sm">
                      Zoom
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={selectedPanel.imageScale}
                        onChange={(event) =>
                          updatePanel(selectedPanel.id, {
                            imageScale: Number(event.target.value),
                          })
                        }
                        className="mt-2 w-full"
                      />
                      <span className="text-xs text-zinc-400">
                        {Math.round(selectedPanel.imageScale * 100)}%
                      </span>
                    </label>

                    <button
                      onClick={resetCrop}
                      className="w-full rounded bg-zinc-600 px-4 py-2 hover:bg-zinc-500"
                    >
                      Reset Crop
                    </button>

                    <button
                      onClick={removeImage}
                      className="w-full rounded bg-zinc-600 px-4 py-2 hover:bg-zinc-500"
                    >
                      Remove Artwork
                    </button>
                  </div>
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
