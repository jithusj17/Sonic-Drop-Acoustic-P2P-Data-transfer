# SonicDrop — Architecture & Engineering Specification

> **Acoustic Peer-to-Peer Data & File Transfer Web Application ("AirDrop over Sound")**

---

## 1. Core Engineering Principles & Strict Rules

To ensure rock-solid stability, deterministic audio processing, and zero memory leaks, all code in SonicDrop must strictly adhere to the following four rules:

### Rule 1: AudioContext & ggwave Isolation (Services Only)
- **Zero React Audio State:** Never instantiate or store `AudioContext`, `AudioWorkletNode`, `AnalyserNode`, or `ggwave` WASM instances inside React components or React state (`useState`, `useRef` directly managing lifecycles, or React contexts).
- **Standalone Singleton Services:** All audio DSP and acoustic protocols live exclusively inside `src/services/` (e.g., `src/services/audio/AudioManager.ts`, `src/services/audio/ggwaveService.ts`).
- **Clean Subscriptions:** Components interact with audio services via typed reactive observers, listeners, or custom hooks that subscribe to service events, rather than owning the underlying Web Audio graphs.

### Rule 2: Centralized Observability & Logging
- **No Rogue `console.log`:** All modules, services, protocol decoders, and API clients must log through `src/lib/logger.ts`.
- **Categorization & Severity:** Every log must be stamped with a severity (`INFO`, `WARN`, `ERROR`, `SUCCESS`) and a subsystem category (`SYSTEM`, `PROTOCOL`, `AUDIO`, `CRYPTO`, `API`).
- **In-Memory Ring Buffer:** The logger maintains a capped circular buffer (up to 100 entries) and provides a reactive pub/sub interface for the developer console (`DebugDrawer`).

### Rule 3: Decoupled Storage via Adapter Interface
- **Adapter Pattern:** Cloud and ephemeral file relay operations must strictly interact with the storage layer through the abstract interface defined in `src/lib/storage/types.ts`.
- **Interchangeability:** Whether backing storage is Supabase Storage, AWS S3, Cloudflare R2, or in-memory mock storage for tests, callers must only depend on `StorageAdapter`.

### Rule 4: Minimalist UI Design System (Strict Anti-Glassmorphism)
- **Zero Blur / Zero Gradients:** No `backdrop-blur`, no heavy drop shadows, no neon glows, and no linear/radial background gradients.
- **Pure Matte Dark Palette:**
  - Background: `#09090B` (`bg-zinc-950`)
  - Cards & Surfaces: `#121215` / `bg-zinc-900`
  - Crisp Borders: Solid `1px` borders (`border-zinc-800`, hover `border-zinc-700`)
  - Typography: Primary `text-zinc-100`, Muted `text-zinc-400`
  - Functional Accents: Solid Emerald (`#10B981`) for active/online, Amber (`#F59E0B`) for warnings/ultrasonic, Rose (`#F43F5E`) for errors.
- **Typography:** Geometric sans-serif for UI labels, and strict monospace (`font-mono` / Geist Mono / JetBrains Mono) for frequencies, byte counters, hashes, and logs.

---

## 2. System Architecture & Dual-Mode Transfer

SonicDrop operates in two distinct transmission modes based on payload size:

```
                          ┌────────────────────────┐
                          │     File / Payload     │
                          └───────────┬────────────┘
                                      │
                         Is size <= 140 bytes?
                                      │
                     ┌────────────────┴────────────────┐
                    YES                                NO
                     ▼                                 ▼
         ┌───────────────────────┐         ┌───────────────────────┐
         │     Pure Acoustic     │         │      Cloud Relay      │
         │       Transfer        │         │   (Acoustic Handover) │
         └───────────┬───────────┘         └───────────┬───────────┘
                     │                                 │
     Encrypted payload modulated             File uploaded to encrypted
     directly via FSK audio sound           storage; 4-char access token
     bursts (Audible or Ultrasonic)         transmitted via sound burst
                     │                                 │
                     ▼                                 ▼
         ┌───────────────────────┐         ┌───────────────────────┐
         │ Receiver microphone   │         │ Receiver microphone   │
         │ decodes data offline  │         │ decodes token & pulls │
         │   (Air-gapped)        │         │ payload via relay API │
         └───────────────────────┘         └───────────────────────┘
```

### 1. Pure Acoustic Mode (`PURE_ACOUSTIC`)
- For short strings, passwords, cryptographic keys, URLs, and tiny payloads ($\le 140$ bytes).
- 100% offline and air-gapped; zero network requests.
- Direct acoustic FSK modulation (Fast Audible or Near-Ultrasonic 18kHz–20kHz).

### 2. Cloud Relay Mode (`CLOUD_RELAY`)
- For large files, images, documents, and payloads $> 140$ bytes.
- Sender encrypts payload on client (AES-GCM-256), pushes to ephemeral storage with 300s TTL, and generates a 4-character pairing token.
- Token and encryption salt are broadcast acoustically over the air.
- Receiver captures acoustic token, exchanges it via relay API, downloads ciphertext, and decrypts client-side.

---

## 3. Directory Structure

```
Acoustic P2P Transfer/
├── ARCHITECTURE.md                 # System architecture and engineering guidelines
├── package.json
├── tsconfig.json
├── next.config.ts
├── public/
└── src/
    ├── app/
    │   ├── globals.css             # Matte dark minimalist theme styles
    │   ├── layout.tsx              # Root HTML shell & fonts
    │   └── page.tsx                # Diagnostic dashboard (Phase 1)
    ├── components/
    │   ├── debug/
    │   │   └── DebugDrawer.tsx     # Monospace developer console & log observer
    │   └── ui/                     # Flat, minimalist design components
    ├── config/
    │   └── constants.ts            # Central system constants (APP_CONFIG)
    ├── lib/
    │   ├── logger.ts               # Singleton reactive logger with pub/sub
    │   └── storage/
    │       └── types.ts            # Abstract storage adapter contract
    ├── services/                   # Isolated non-React singleton services (Phase 2+)
    └── types/
        └── index.ts                # TypeScript domain models and protocol types
```

---

## 4. Phase Roadmap

- **Phase 1 (Current):** Project architecture, strict minimalist design system, central reactive logger, and collapsible bottom debug drawer.
- **Phase 2:** Audio engine singleton (`AudioManager`), Web Audio API pipeline, and `ggwave` WASM integration (Audible + Ultrasonic FSK).
- **Phase 3:** Cryptography layer (Web Crypto API, AES-GCM-256 ephemeral keys, HMAC integrity checks).
- **Phase 4:** Cloud Relay storage adapter & token negotiation API.
- **Phase 5:** Full AirDrop-style minimalist UI with real-time acoustic visualizer, transmitter, and receiver workflows.
