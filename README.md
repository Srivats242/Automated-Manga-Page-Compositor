# Manga Compositor

A web-based manga page editor built with **Next.js, React, TypeScript, and Tailwind CSS**. Users can create custom manga layouts, upload artwork, add and customize speech bubbles, and export completed pages as PNG images.

The application also supports saving and loading editable projects, allowing users to continue working on their manga compositions across sessions.

## Features

### Panel Management
- Add, move, resize, duplicate, and delete manga panels.
- Position panels freely within a 600 × 850 manga canvas.
- Upload artwork into individual panels.
- Adjust artwork positioning and zoom.
- Switch between dragging the panel and repositioning the artwork inside it.

### Speech Bubble Editor
- Add, move, resize, duplicate, and delete speech bubbles.
- Edit dialogue directly through the properties panel.
- Customize supported bubble shapes, text formatting, and appearance.
- Position speech bubbles independently of manga panels.

### Project Management
- **Save Project:** Download the current manga composition as a JSON file.
- **Load Project:** Restore a previously saved project, including panels, artwork, speech bubbles, and styling.
- Validate project files before loading.
- Confirm before replacing an existing composition.
- Clear the entire canvas with a confirmation prompt.

### Export
- Export completed manga pages as PNG images.
- Preserve panel positions, artwork, and speech bubbles in the exported image.
- Hide editing controls during export.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js | Application framework |
| React | Component-based user interface |
| TypeScript | Type-safe application development |
| Tailwind CSS | Styling and responsive UI |
| html-to-image | PNG image export |
| JSON | Project serialization and restoration |

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

Clone the repository:

```bash
git clone https://github.com/Srivats242/Automated-Manga-Page-Compositor.git
```

Navigate into the project:

```bash
cd Automated-Manga-Page-Compositor
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## How to Use

1. Click **Add Panel** to create a manga panel.
2. Select the panel and upload an image using the properties sidebar.
3. Adjust the panel's dimensions, artwork position, and zoom.
4. Click **Add Speech Bubble** to add dialogue.
5. Customize and position the speech bubble.
6. Click **Save Project** to download an editable JSON project.
7. Use **Load Project** to reopen a saved composition.
8. Click **Export PNG** to download the finished manga page.

## Project Structure

```text
src/
├── app/
│   └── page.tsx
├── components/
│   ├── MangaEditor.tsx
│   ├── MangaPanel.tsx
│   └── SpeechBubble.tsx
└── types/
    ├── manga.ts
    └── speechBubble.ts
```

## Technical Highlights

**Interactive canvas editing:** Implemented panel and speech bubble manipulation using React state and pointer interactions, with position and size constraints.

**Artwork transformations:** Added image zoom and positioning controls while keeping artwork constrained within its panel.

**Project persistence:** Implemented JSON serialization and deserialization to save and restore editable compositions, including embedded artwork.

**File validation:** Added checks for project version, canvas dimensions, and essential panel and speech bubble properties before restoring saved data.

**Image export:** Integrated `html-to-image` to generate downloadable PNG files from the manga canvas.

## Development Milestones

| Version | Milestone |
|---|---|
| v0.3–v0.7 | Core panel editing, artwork controls, speech bubbles, and PNG export |
| v0.9 | Expanded editing and customization functionality |
| v1.0 | Save and load editable manga projects |

## Future Improvements

- Undo and redo functionality.
- Additional manga page templates.
- Layer ordering controls.
- Multiple-page manga projects.
- Improved mobile and tablet editing experience.

## Author

**Srivats Pulumati**

Computer Science student at the University of Pittsburgh.

[GitHub Profile](https://github.com/Srivats242)
