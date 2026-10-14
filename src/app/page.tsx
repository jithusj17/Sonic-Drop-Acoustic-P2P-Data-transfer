'use client';

import React, { useEffect } from 'react';
import {
  Activity,
  Volume2,
  ShieldCheck,
  AlertTriangle,
  Radio,
  FileCode,
  Lock,
  Layers,
} from 'lucide-react';
import { APP_CONFIG } from '@/config/constants';
import { logger } from '@/lib/logger';
import { DebugDrawer } from '@/components/debug/DebugDrawer';

export default function HomePage() {
  // Boot system message on mount
  useEffect(() => {
    logger.info(
      'SYSTEM',
      `${APP_CONFIG.APP_NAME} v${APP_CONFIG.APP_VERSION} initialized. Architecture validated.`,
      {
        sampleRate: `${APP_CONFIG.SAMPLE_RATE} Hz`,
        maxBytes: `${APP_CONFIG.MAX_ACOUSTIC_BYTES} B`,
        relayTTL: `${APP_CONFIG.RELAY_TTL_SECONDS} s`,
      }
    );
  }, []);

  const handleTestSystem = () => {
    logger.info('SYSTEM', 'Diagnostic sweep passed: Memory & runtime nominal', {
      timestamp: Date.now(),
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'Node',
      appState: 'READY',
    });
  };

  const handleTestAudio = () => {
    logger.info(
      'AUDIO',
      `Simulated AudioContext probe: 48,000 Hz, protocol=ULTRASONIC_STEALTH`,
      {
        sampleRate: APP_CONFIG.SAMPLE_RATE,
        band: '18,500 Hz - 20,000 Hz',
        status: 'READY_TO_EMIT',
      }
    );
  };

  const handleTestCrypto = () => {
    logger.success(
      'CRYPTO',
      'Ephemeral keypair generated via Web Crypto API (AES-GCM-256)',
      {
        algorithm: 'AES-GCM',
        keyLength: 256,
        ivBytes: 12,
        ephemeral: true,
      }
    );
  };

  const handleTestError = () => {
    logger.error(
      'API',
      'Acoustic frame dropped: Carrier SNR below detection threshold (-18 dB)',
      {
        error: 'FRAME_CRC_MISMATCH',
        snr: '-18.4 dB',
        code: 422,
      }
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-zinc-100">
      {/* Top Header */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-4 py-3.5 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Radio className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-wide text-zinc-100 uppercase">
                {APP_CONFIG.APP_NAME}
              </h1>
              <p className="text-[11px] font-mono text-zinc-400">
                Acoustic P2P Data & File Transfer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 border border-zinc-800 bg-zinc-900">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="text-[11px] font-mono tracking-wider text-zinc-300">
              PHASE 1 // SYSTEM READY
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 pb-72">
        {/* Intro Banner */}
        <section className="mb-8">
          <div className="border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
                ARCHITECTURE FOUNDATION
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                STEP 01 COMPLETE
              </span>
            </div>
            <h2 className="text-xl font-medium tracking-tight text-zinc-100 mb-2">
              AirDrop Over Sound — Diagnostic Console
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
              Zero-blur, flat matte dark minimal UI with decoupled singleton
              logging and Web Audio isolation. Verify system parameters and
              trigger diagnostic log streams into the real-time Debug Drawer
              below.
            </p>
          </div>
        </section>

        {/* 3 APP_CONFIG Stat Blocks */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Core Configuration
            </h3>
            <span className="text-[11px] font-mono text-zinc-400">
              src/config/constants.ts
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Stat Block 1 */}
            <div className="border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                SAMPLE RATE
              </div>
              <div className="text-2xl font-semibold font-mono text-zinc-100 tracking-tight">
                {APP_CONFIG.SAMPLE_RATE.toLocaleString()} Hz
              </div>
              <div className="text-[11px] font-mono text-zinc-400 mt-2 border-t border-zinc-800/80 pt-2">
                48 kHz Web Audio standard
              </div>
            </div>

            {/* Stat Block 2 */}
            <div className="border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                MAX ACOUSTIC BYTES
              </div>
              <div className="text-2xl font-semibold font-mono text-zinc-100 tracking-tight">
                {APP_CONFIG.MAX_ACOUSTIC_BYTES} Bytes
              </div>
              <div className="text-[11px] font-mono text-zinc-400 mt-2 border-t border-zinc-800/80 pt-2">
                Pure acoustic frame payload cap
              </div>
            </div>

            {/* Stat Block 3 */}
            <div className="border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                RELAY TTL
              </div>
              <div className="text-2xl font-semibold font-mono text-zinc-100 tracking-tight">
                {APP_CONFIG.RELAY_TTL_SECONDS}s TTL
              </div>
              <div className="text-[11px] font-mono text-zinc-400 mt-2 border-t border-zinc-800/80 pt-2">
                {APP_CONFIG.TOKEN_LENGTH}-char token pairing window
              </div>
            </div>
          </div>
        </section>

        {/* 4 Test Buttons */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Diagnostic Log Dispatches
            </h3>
            <span className="text-[11px] font-mono text-zinc-400">
              Click to emit reactive logs
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleTestSystem}
              className="border border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-900/80 active:bg-zinc-800/60 p-4 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-medium text-zinc-200 group-hover:text-zinc-100">
                  Test System
                </span>
                <Activity className="w-4 h-4 text-zinc-400 group-hover:text-zinc-300" />
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                Push SYSTEM category info log with runtime metadata
              </p>
            </button>

            <button
              type="button"
              onClick={handleTestAudio}
              className="border border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-900/80 active:bg-zinc-800/60 p-4 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-medium text-zinc-200 group-hover:text-zinc-100">
                  Test Audio
                </span>
                <Volume2 className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                Push AUDIO protocol probe at 48,000 Hz ultrasound band
              </p>
            </button>

            <button
              type="button"
              onClick={handleTestCrypto}
              className="border border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-900/80 active:bg-zinc-800/60 p-4 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-medium text-zinc-200 group-hover:text-zinc-100">
                  Test Crypto
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                Push CRYPTO success log with AES-GCM-256 keypair details
              </p>
            </button>

            <button
              type="button"
              onClick={handleTestError}
              className="border border-zinc-800 bg-zinc-900 hover:border-zinc-700 hover:bg-zinc-900/80 active:bg-zinc-800/60 p-4 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-medium text-zinc-200 group-hover:text-zinc-100">
                  Test Error
                </span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-[11px] font-mono text-zinc-400">
                Push API error simulation with CRC mismatch payload
              </p>
            </button>
          </div>
        </section>

        {/* Architecture Checklist Card */}
        <section>
          <div className="border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-400" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-200">
                  Engineering Rules Specification
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">
                STRICT COMPLIANCE
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs text-zinc-300">
              <div className="flex items-start gap-2.5">
                <span className="text-zinc-400 shrink-0">[01]</span>
                <div>
                  <strong className="text-zinc-200">Audio Isolation:</strong> AudioContext & ggwave WASM instances are restricted to standalone singleton services in <code className="text-zinc-300 bg-zinc-950 px-1 py-0.5 border border-zinc-800">src/services/</code>, never in React state.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-zinc-400 shrink-0">[02]</span>
                <div>
                  <strong className="text-zinc-200">Central Logging:</strong> All subsystems log exclusively via <code className="text-zinc-300 bg-zinc-950 px-1 py-0.5 border border-zinc-800">src/lib/logger.ts</code> with categorized ring-buffer storage.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-zinc-400 shrink-0">[03]</span>
                <div>
                  <strong className="text-zinc-200">Storage Decoupling:</strong> Relayed files use the abstract <code className="text-zinc-300 bg-zinc-950 px-1 py-0.5 border border-zinc-800">StorageAdapter</code> interface in <code className="text-zinc-300 bg-zinc-950 px-1 py-0.5 border border-zinc-800">src/lib/storage/types.ts</code>.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-zinc-400 shrink-0">[04]</span>
                <div>
                  <strong className="text-zinc-200">Zero Glassmorphism:</strong> Flat matte dark palette (<code className="text-zinc-300 bg-zinc-950 px-1 py-0.5 border border-zinc-800">#09090B</code> / <code className="text-zinc-300 bg-zinc-950 px-1 py-0.5 border border-zinc-800">#121215</code>), 1px solid borders, zero gradients, and zero blur.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Persistent Developer Bottom Console */}
      <DebugDrawer />
    </div>
  );
}
