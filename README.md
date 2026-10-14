# Sonic-Drop-Acoustic-P2P-Data-transfer

> **SonicDrop** — Ultra-minimalist Acoustic Peer-to-Peer Data & File Transfer web application ("AirDrop over Sound").

---

## Overview

SonicDrop enables air-gapped, peer-to-peer data and file transfer between devices using near-ultrasound (and audible) acoustic frequency modulation (FSK).

- **Pure Acoustic Mode ($\le 140$ bytes):** 100% offline, air-gapped data transmission directly over sound waves.
- **Cloud Relay Mode ($> 140$ bytes):** End-to-end encrypted file relay with acoustic 4-character token handover.

---

## Tech Stack & Architecture

- **Framework:** Next.js 16 (App Router, Turbopack, React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Strict minimalist matte dark design system, no glassmorphism)
- **Icons:** Lucide React
- **Architecture Guidelines:** See [`ARCHITECTURE.md`](./ARCHITECTURE.md)
  1. Web Audio API / `ggwave` WASM isolated in standalone singleton services (`src/services/`).
  2. Central reactive pub/sub logging (`src/lib/logger.ts`) with bottom `DebugDrawer`.
  3. Abstract storage adapter interface (`src/lib/storage/types.ts`).
  4. Minimalist matte dark aesthetic (`#09090B` / `#121215`).

---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)
