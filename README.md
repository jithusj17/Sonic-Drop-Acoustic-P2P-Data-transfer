# Sonic-Drop-Acoustic-P2P-Data-transfer

> **SonicDrop** — Ultra-minimalist Acoustic Peer-to-Peer Data & File Transfer web application ("AirDrop over Sound").

SonicDrop enables air-gapped, peer-to-peer data and file transfer between nearby devices using sound waves — modulating data into audible and near-ultrasonic acoustic frequencies (FSK).

---

## Key Features & Completed Milestones

### 1. Minimalist UI Design System (Strict Anti-Glassmorphism)
- **Matte Dark Industrial Aesthetic:** Inspired by Teenage Engineering & Vercel. Pure dark surfaces (`#09090B` / `#121215`) with crisp solid `1px` borders (`border-zinc-800`), zero gradients, zero shadows, and zero `backdrop-blur`.
- **High-Precision Monospace Telemetry:** Geometric sans-serif UI labels paired with strict monospace metrics (Geist Mono) for frequencies, byte counts, and logs.
- **Functional Solid Accents:**
  - Emerald (`#10B981`) for active/online direct acoustic links.
  - Amber (`#F59E0B`) for warnings, ultrasound mode, and cloud relay handovers.
  - Rose (`#F43F5E`) for transmission errors and dropped frames.

### 2. Dual-Mode Transmission Architecture
- **Pure Acoustic Mode (`PURE_ACOUSTIC` | $\le 140$ bytes):**
  - 100% offline, air-gapped data transfer without network or internet access.
  - Text, passwords, encryption keys, and URLs are modulated directly into acoustic frames (`T:<payload>`).
- **Cloud Relay Mode (`CLOUD_RELAY` | $> 140$ bytes or Files):**
  - Ephemeral file relay for documents, photos, and large files.
  - Client encrypts payload with AES-GCM-256 and uploads to temporary storage (300s TTL).
  - A short 4-character pairing token and encryption IV are broadcast acoustically (`F:<token>:<keyIv>`).
  - Receiving device captures the acoustic token and downloads ciphertext directly.

### 3. Core Acoustic Packet Protocol (`src/lib/protocol.ts`)
- **UTF-8 Byte Accuracy:** Uses `TextEncoder` to calculate exact multi-byte lengths across Unicode, emojis, and foreign scripts.
- **Payload Analyzer (`analyzePayload`):** Real-time bandwidth evaluator checking text and file attachments against the 140-byte acoustic threshold with percentage utilization.
- **Frame Encoders:**
  - `encodeTextPacket(text)`: Validates length, prefixes with `T:`, and formats acoustic frames.
  - `encodeFileRelayPacket(token, keyIv)`: Validates 4-character tokens and formats handshake frames.
- **Frame Decoder (`decodePacket`):** Parses raw incoming sound bursts, dispatches to typed packet structures, and catches malformed data.

### 4. Interactive UI Shell & Components
- **Global Header (`src/components/Header.tsx`):**
  - Minimal SonicDrop brand mark with version badge (`v0.3`).
  - Segmented toggle to switch between **AUDIBLE (1.8kHz–4.5kHz)** and **ULTRASONIC (18.5kHz+)** carrier bands.
- **Transmitter View (`src/components/transmitter/TransmitterView.tsx`):**
  - Hybrid text input and drag-and-drop file staging area with size calculation.
  - Live protocol telemetry bar with dynamic byte counter (`XX / 140 BYTES`), progress indicator, and automatic mode badge.
  - Broadcast action with full state progression (`IDLE` $\to$ `ENCODING_AUDIO` $\to$ `BROADCASTING` $\to$ `COMPLETED`).
- **Receiver View & Feed (`src/components/receiver/ReceiverView.tsx`):**
  - Microphone demodulator controls with `Start Listening` / `Stop Listening` toggles.
  - Simulation engine (`"Simulate Incoming Signal"`) to test decoded payloads offline.
  - Received items feed with `PayloadCard` components featuring **Copy Text**, **Open URL**, and **Download File** actions.
- **Central Reactive Logger & Developer Drawer (`src/lib/logger.ts` & `DebugDrawer.tsx`):**
  - Singleton pub/sub logger with a 100-entry circular ring buffer.
  - Fixed bottom developer console with expand/collapse toggle, category filters (`ALL`, `SYSTEM`, `PROTOCOL`, `AUDIO`, `CRYPTO`, `API`), clipboard export, and clear action.
- **Developer Protocol Sandbox:**
  - Collapsible interactive accordion on the main page to test packet encoding, handshake simulation, frame decoding, and error telemetry.

---

## Project Structure

```
Acoustic P2P Transfer/
├── ARCHITECTURE.md                  # Strict engineering guidelines & system design
├── README.md                        # Documentation & setup guide
├── package.json                     # Dependencies & build scripts
├── tsconfig.json                    # TypeScript compiler configuration
├── next.config.ts                   # Next.js configuration
├── public/                          # Static assets
└── src/
    ├── app/
    │   ├── globals.css              # Minimalist matte dark styling
    │   ├── layout.tsx               # Root shell & typography
    │   └── page.tsx                 # Main dashboard, tab navigation & sandbox
    ├── components/
    │   ├── Header.tsx               # Header with audio protocol switcher
    │   ├── debug/
    │   │   └── DebugDrawer.tsx      # Reactive bottom developer console
    │   ├── transmitter/
    │   │   └── TransmitterView.tsx  # Input zone, telemetry & broadcast simulator
    │   └── receiver/
    │       ├── ReceiverView.tsx     # Demodulator controls & incoming feed
    │       └── PayloadCard.tsx      # Received item display with contextual actions
    ├── config/
    │   └── constants.ts             # Central constants (APP_CONFIG: sample rate, byte caps)
    ├── lib/
    │   ├── logger.ts                # Reactive singleton pub/sub logger
    │   ├── protocol.ts              # Acoustic packet protocol encoder/decoder
    │   └── storage/
    │       └── types.ts             # Abstract storage adapter interface
    └── types/
        └── index.ts                 # Strict TypeScript domain models & packet types
```

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, React 19)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 (Zero-blur, flat matte dark industrial design)
- **Icons:** Lucide React
- **Architecture:** Decoupled singleton services, reactive pub/sub logging, abstract storage adapters

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open in Browser
Navigate to [http://localhost:3000](http://localhost:3000)

---

## Roadmap

- [x] **Step 1:** Architecture specification, minimalist dark design system, reactive logger, and bottom debug drawer.
- [x] **Step 2:** Core acoustic packet protocol (`protocol.ts`), UTF-8 byte calculator, and protocol inspector.
- [x] **Step 3:** Production minimalist UI shell (Header, Transmitter, Receiver, Payload Cards, and Protocol Switcher).
- [ ] **Step 4:** Audio Engine Singleton (`AudioManager`), Web Audio API pipeline, and `ggwave` WASM FSK modulation/demodulation.
- [ ] **Step 5:** Client-side cryptography (AES-GCM-256 Web Crypto API) and cloud relay storage adapter.
