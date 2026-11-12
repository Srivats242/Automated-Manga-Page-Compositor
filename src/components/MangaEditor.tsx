"use client";

import { toPng } from "html-to-image";
import { useRef, useState } from "react";
import type { MangaPanel as MangaPanelType } from "../types/manga";
import MangaPanel from "./MangaPanel";
import type { SpeechBubble as SpeechBubbleType } from "../types/speechBubble";
import SpeechBubble from "./SpeechBubble";

const PAGE_WIDTH = 600;
const PAGE_HEIGHT = 850;
const MIN_SIZE = 50;

type EditorSnapshot = {
  panels: MangaPanelType[];
  bubbles: SpeechBubbleType[];
};

const MAX_HISTORY = 30;

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
  const projectInputRef = useRef<HTMLInputElement>(null);
  const mangaPageRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [bubbles, setBubbles] = useState<SpeechBubbleType[]>([]);
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);

  const [past, setPast] = useState<EditorSnapshot[]>([]);
  const [future, setFuture] = useState<EditorSnapshot[]>([]);
  const dialogueHistoryRecorded = useRef(false);

  const selectedBubble = bubbles.find(
    (bubble) => bubble.id === selectedBubbleId
  );

  const selectedPanel = panels.find(
    (panel) => panel.id === selectedPanelId
  );

  const maxImageX = selectedPanel
  ? (selectedPanel.width * (selectedPanel.imageScale - 1)) / 2
  : 0;

  const maxImageY = selectedPanel
    ? (selectedPanel.height * (selectedPanel.imageScale - 1)) / 2
    : 0;
  
  function recordHistory() {
    const snapshot: EditorSnapshot = {
      panels,
      bubbles,
    };

    setPast((current) => [
      ...current.slice(-(MAX_HISTORY - 1)),
      snapshot,
    ]);

    setFuture([]);
  }


function undo() {
  if (past.length === 0) return;

  const previous = past[past.length - 1];

  setFuture((current) => [
    {
      panels,
      bubbles,
    },
    ...current,
  ]);

  setPanels(previous.panels);
  setBubbles(previous.bubbles);
  setPast((current) => current.slice(0, -1));

  setSelectedPanelId(null);
  setSelectedBubbleId(null);
  dialogueHistoryRecorded.current = false;
}

  function redo() {
    if (future.length === 0) return;

    const next = future[0];

    setPast((current) => [
      ...current.slice(-(MAX_HISTORY - 1)),
      {
        panels,
        bubbles,
      },
    ]);

    setPanels(next.panels);
    setBubbles(next.bubbles);
    setFuture((current) => current.slice(1));

    setSelectedPanelId(null);
    setSelectedBubbleId(null);
    dialogueHistoryRecorded.current = false;
  }

  function addPanel() {
    recordHistory();

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
    setSelectedBubbleId(null);
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

    recordHistory();
    setPanels((current) =>
      current.filter((panel) => panel.id !== selectedPanelId)
    );

    setSelectedPanelId(null);
  }

  function duplicatePanel() {
    if (!selectedPanel) return;

    recordHistory();

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
  
  function addBubble() {
    recordHistory();

    const bubble: SpeechBubbleType = {
      id: crypto.randomUUID(),
      x: 100,
      y: 100,
      width: 180,
      height: 110,
      text: "Your dialogue here",
      fontSize: 18,
      shape: "oval",
      showTail: false,
      textAlign: "center",
      bold: false,
      italic: false,
      borderWidth: 2,
      borderColor: "#000000",
    };

    setBubbles((current) => [...current, bubble]);
    setSelectedBubbleId(bubble.id);
    setSelectedPanelId(null);
  }

  function updateBubble(
    id: string,
    changes: Partial<SpeechBubbleType>
  ) {
    setBubbles((current) =>
      current.map((bubble) => {
        if (bubble.id !== id) return bubble;

        const updated = { ...bubble, ...changes };

        const width = clampRound(updated.width, 80, PAGE_WIDTH);
        const height = clampRound(updated.height, 60, PAGE_HEIGHT);

        return {
          ...updated,
          width,
          height,
          x: clampRound(updated.x, 0, PAGE_WIDTH - width),
          y: clampRound(updated.y, 0, PAGE_HEIGHT - height),
          fontSize: clampRound(updated.fontSize, 10, 48),
          borderWidth: clampRound(updated.borderWidth ?? 2, 1, 8),
        };
      })
    );
  }

  function editBubble(
    id: string,
    changes: Partial<SpeechBubbleType>
  ) {
    const bubble = bubbles.find((item) => item.id === id);

    if (!bubble) return;

    const hasChanges = Object.entries(changes).some(
      ([key, value]) =>
        bubble[key as keyof SpeechBubbleType] !== value
    );

    if (!hasChanges) return;

    recordHistory();
    updateBubble(id, changes);
  }

  function startDialogueEdit() {
  if (dialogueHistoryRecorded.current) return;

  recordHistory();
  dialogueHistoryRecorded.current = true;
  }
  function moveBubble(id: string, x: number, y: number) {
    updateBubble(id, { x, y });
  }

  function resizeBubble(
    id: string,
    width: number,
    height: number
  ) {
    setBubbles((current) =>
      current.map((bubble) => {
        if (bubble.id !== id) return bubble;

        return {
          ...bubble,
          width: clampRound(width, 80, PAGE_WIDTH - bubble.x),
          height: clampRound(height, 60, PAGE_HEIGHT - bubble.y),
        };
      })
    );
  }

  function deleteBubble() {
    if (!selectedBubbleId) return;

    recordHistory();

    setBubbles((current) =>
      current.filter((bubble) => bubble.id !== selectedBubbleId)
    );

    setSelectedBubbleId(null);
  }

  function duplicateBubble() {
    if (!selectedBubble) return;

    recordHistory();
    const copy: SpeechBubbleType = {
      ...selectedBubble,
      id: crypto.randomUUID(),
      x: Math.min(
        selectedBubble.x + 20,
        PAGE_WIDTH - selectedBubble.width
      ),
      y: Math.min(
        selectedBubble.y + 20,
        PAGE_HEIGHT - selectedBubble.height
      ),
    };

    setBubbles((current) => [...current, copy]);
    setSelectedBubbleId(copy.id);
    setSelectedPanelId(null);
  }
  
  function resetBubbleStyling() {
    if (!selectedBubbleId) return;

    editBubble(selectedBubbleId, {
      shape: "oval",
      showTail: false,
      textAlign: "center",
      bold: false,
      italic: false,
      borderWidth: 2,
      borderColor: "#000000",
    });
  }

  function clearPage() {
    const confirmed = window.confirm(
      "Clear the entire manga page? This will remove all panels and speech bubbles."
    );

  if (!confirmed) return;
  
  if (panels.length === 0 && bubbles.length === 0) return;
    recordHistory();

    setPanels([]);
    setBubbles([]);
    setSelectedPanelId(null);
    setSelectedBubbleId(null);
  }


  function saveProject() {
    const project = {
      version: 1,
      pageWidth: PAGE_WIDTH,
      pageHeight: PAGE_HEIGHT,
      panels,
      bubbles,
    };

    const json = JSON.stringify(project, null, 2);

    const blob = new Blob([json], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "manga-project.json";
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }


  async function loadProject(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    // Allow the same project file to be selected again.
    event.target.value = "";

    try {
      const text = await file.text();
      const project: unknown = JSON.parse(text);

      if (
        typeof project !== "object" ||
        project === null ||
        !("version" in project) ||
        project.version !== 1 ||
        !("pageWidth" in project) ||
        project.pageWidth !== PAGE_WIDTH ||
        !("pageHeight" in project) ||
        project.pageHeight !== PAGE_HEIGHT ||
        !("panels" in project) ||
        !Array.isArray(project.panels) ||
        !("bubbles" in project) ||
        !Array.isArray(project.bubbles)
      ) {
        alert("Invalid or unsupported manga project file.");
        return;
      }

      const validPanel = (panel: unknown): panel is MangaPanelType => {
        if (typeof panel !== "object" || panel === null) return false;

        const p = panel as Record<string, unknown>;

        return (
          typeof p.id === "string" &&
          ["x", "y", "width", "height", "imageX", "imageY", "imageScale"]
            .every((key) =>
              typeof p[key] === "number" &&
              Number.isFinite(p[key])
            ) &&
          (p.imageMode === "panel" || p.imageMode === "artwork") &&
          (p.image === undefined ||
            (typeof p.image === "string" &&
              /^data:image\/(png|jpeg|webp);base64,/.test(p.image)))
        );
      };

      const validBubble = (
        bubble: unknown
      ): bubble is SpeechBubbleType => {
        if (typeof bubble !== "object" || bubble === null) return false;

        const b = bubble as Record<string, unknown>;

        return (
          typeof b.id === "string" &&
          typeof b.text === "string" &&
          ["x", "y", "width", "height", "fontSize"]
            .every((key) =>
              typeof b[key] === "number" &&
              Number.isFinite(b[key])
            ) &&
          (b.shape === undefined ||
            ["oval", "rectangle", "thought"].includes(String(b.shape))) &&
          (b.textAlign === undefined ||
            ["left", "center", "right"].includes(String(b.textAlign))) &&
          (b.showTail === undefined || typeof b.showTail === "boolean") &&
          (b.bold === undefined || typeof b.bold === "boolean") &&
          (b.italic === undefined || typeof b.italic === "boolean") &&
          (b.borderWidth === undefined ||
            (typeof b.borderWidth === "number" &&
              Number.isFinite(b.borderWidth))) &&
          (b.borderColor === undefined ||
            (typeof b.borderColor === "string" &&
              /^#[0-9a-fA-F]{6}$/.test(b.borderColor)))
        );
      };

      if (
        !project.panels.every(validPanel) ||
        !project.bubbles.every(validBubble)
      ) {
        alert("The project contains invalid panel or speech bubble data.");
        return;
      }

      const confirmed = window.confirm(
        "Load this project? Your current unsaved work will be replaced."
      );

      if (!confirmed) return;

      setPanels(project.panels);
      setBubbles(project.bubbles);

      setPast([]);
      setFuture([]);

      setSelectedPanelId(null);
      setSelectedBubbleId(null);
    } catch (error) {
      console.error("Failed to load manga project:", error);
      alert("Unable to read the project file. Please select a valid JSON file.");
    }
  }


  
  async function exportPage() {
    if (!mangaPageRef.current || isExporting) return;

    setIsExporting(true);

    try {
      // Wait for React to hide selection outlines and handles.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });

      const dataUrl = await toPng(mangaPageRef.current, {
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        pixelRatio: 1,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = "manga-page.png";
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to export manga page:", error);
      alert("Unable to export the manga page.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-900 text-white">
      <header className="flex h-16 items-center justify-between border-b border-zinc-700 px-6">
        <h1 className="text-xl font-bold">
          Manga Compositor
        </h1>

        
      <div className="flex gap-3">

        <button
          onClick={undo}
          disabled={past.length === 0}
          className="rounded bg-zinc-600 px-4 py-2 font-medium text-white hover:bg-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Undo
        </button>

        <button
          onClick={redo}
          disabled={future.length === 0}
          className="rounded bg-zinc-600 px-4 py-2 font-medium text-white hover:bg-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Redo
        </button>

        <button
          onClick={addPanel}
          className="rounded bg-white px-4 py-2 font-medium text-black hover:bg-zinc-200"
        >
          Add Panel
        </button>

        <button
          onClick={addBubble}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Add Speech Bubble
        </button>
        <button
          onClick={exportPage}
          disabled={isExporting}
          className="rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isExporting ? "Exporting..." : "Export PNG"}
        </button>
        <button
          onClick={clearPage}
          className="rounded bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
        >
          Clear Page
        </button>

        <button
          onClick={saveProject}
          className="rounded bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700"
        >
          Save Project
        </button>

        <input
          ref={projectInputRef}
          type="file"
          accept=".json,application/json"
          onChange={loadProject}
          className="hidden"
        />

        <button
          onClick={() => projectInputRef.current?.click()}
          className="rounded bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700"
        >
          Load Project
        </button>
      </div>
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
            ref={mangaPageRef}
            className="relative shrink-0 bg-white shadow-2xl"
            style={{
              width: PAGE_WIDTH,
              height: PAGE_HEIGHT,
            }}
            onPointerDown={() => {
              setSelectedPanelId(null);
              setSelectedBubbleId(null);
            }}
          >
            {panels.map((panel) => (
              <MangaPanel
                key={panel.id}
                panel={panel}
                selected={selectedPanelId === panel.id && !isExporting}  
                onSelect={() => {
                  setSelectedPanelId(panel.id);
                  setSelectedBubbleId(null);
                }}
                onMove={movePanel}
                onResize={resizePanel}
                onMoveArtwork={moveArtwork}
                onEditStart={recordHistory}
              />
            ))}
   
          {bubbles.map((bubble) => (
            <SpeechBubble
              key={bubble.id}
              bubble={bubble}
              selected={selectedBubbleId === bubble.id && !isExporting}
              onSelect={() => {
                setSelectedBubbleId(bubble.id);
                setSelectedPanelId(null);
              }}
              onMove={moveBubble}
              onResize={resizeBubble}
              onEditStart={recordHistory}
            />
          ))}
          </div>
        </section>

        <aside className="w-64 shrink-0 border-l border-zinc-700 bg-zinc-800 p-4">
          <h2 className="mb-5 font-semibold">Properties</h2>

          
        {selectedBubble ? (
          <div className="space-y-4">
            <p className="font-semibold">Speech Bubble</p>

            <label className="block text-sm">
              Dialogue
              <textarea
              value={selectedBubble.text}
              onChange={(event) => {
                if (event.target.value === selectedBubble.text) return;

                startDialogueEdit();

                updateBubble(selectedBubble.id, {
                  text: event.target.value,
                });
              }}
              onBlur={() => {
                dialogueHistoryRecorded.current = false;
              }}
              rows={4}
              className="mt-2 w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-white"
              />
            </label>

            {(["x", "y", "width", "height", "fontSize"] as const).map(
              (property) => (
                <label key={property} className="block text-sm">
                  {property === "fontSize"
                    ? "Font Size"
                    : property.toUpperCase()}

                  <input
                    type="number"
                    value={selectedBubble[property]}
                    onChange={(event) => {
                      const value = event.target.valueAsNumber;
                      if (!Number.isFinite(value)) return;

                      updateBubble(selectedBubble.id, {
                        [property]: value,
                      });
                    }}
                    className="mt-1 w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2 text-white"
                  />
                </label>
              )
            )}
            
            <div className="space-y-4 border-t border-zinc-600 pt-4">
              <h3 className="font-medium">Bubble Styling</h3>

              <label className="block text-sm">
                Bubble Shape
                <select
                  value={selectedBubble.shape ?? "oval"}
                  onChange={(event) =>
                    editBubble(selectedBubble.id, {
                      shape: event.target.value as
                        "oval" | "rectangle" | "thought",
                    })
                  }
                  className="mt-2 w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2"
                >
                  <option value="oval">Oval</option>
                  <option value="rectangle">Rectangle</option>
                  <option value="thought">Thought Bubble</option>
                </select>
              </label>

              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={selectedBubble.showTail ?? false}
                  onChange={(event) =>
                    editBubble(selectedBubble.id, {
                      showTail: event.target.checked,
                    })
                  }
                />
                Show Speech Tail
              </label>

              <label className="block text-sm">
                Text Alignment
                <select
                  value={selectedBubble.textAlign ?? "center"}
                  onChange={(event) =>
                    editBubble(selectedBubble.id, {
                      textAlign: event.target.value as
                        "left" | "center" | "right",
                    })
                  }
                  className="mt-2 w-full rounded border border-zinc-600 bg-zinc-900 px-3 py-2"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>

              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={selectedBubble.bold ?? false}
                  onChange={(event) =>
                    editBubble(selectedBubble.id, {
                      bold: event.target.checked,
                    })
                  }
                />
                Bold Text
              </label>

              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={selectedBubble.italic ?? false}
                  onChange={(event) =>
                    editBubble(selectedBubble.id, {
                      italic: event.target.checked,
                    })
                  }
                />
                Italic Text
              </label>

              <label className="block text-sm">
                Outline Thickness
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={selectedBubble.borderWidth ?? 2}
                  onChange={(event) =>
                    updateBubble(selectedBubble.id, {
                      borderWidth: Number(event.target.value),
                    })
                  }
                  className="mt-2 w-full"
                />
                <span className="text-xs text-zinc-400">
                  {selectedBubble.borderWidth ?? 2}px
                </span>
              </label>

              <label className="block text-sm">
                Outline Color
                <input
                  type="color"
                  value={selectedBubble.borderColor ?? "#000000"}
                  onChange={(event) =>
                    updateBubble(selectedBubble.id, {
                      borderColor: event.target.value,
                    })
                  }
                  className="mt-2 block h-10 w-full cursor-pointer"
                />
              </label>

              <button
                onClick={resetBubbleStyling}
                className="w-full rounded bg-zinc-600 px-4 py-2 text-white hover:bg-zinc-500"
              >
                Reset Bubble Styling
              </button>
            </div>

            <button
              onClick={duplicateBubble}
              className="w-full rounded bg-blue-600 px-4 py-2 hover:bg-blue-700"
            >
              Duplicate Bubble
            </button>

            <button
              onClick={deleteBubble}
              className="w-full rounded bg-red-600 px-4 py-2 hover:bg-red-700"
            >
              Delete Bubble
            </button>
          </div>
        ) : selectedPanel ? (
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
