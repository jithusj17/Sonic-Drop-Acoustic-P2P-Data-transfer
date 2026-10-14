'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Volume2,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Layers,
  Code2,
  Bug,
  FileText,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import { APP_CONFIG } from '@/config/constants';
import { logger } from '@/lib/logger';
import {
  analyzePayload,
  decodePacket,
  encodeFileRelayPacket,
  encodeTextPacket,
} from '@/lib/protocol';
import { DecodedPacket } from '@/types';
import { DebugDrawer } from '@/components/debug/DebugDrawer';

export default function HomePage() {
  // Protocol Sandbox State
  const [inputText, setInputText] = useState('Hello SonicDrop! 🚀 (AirDrop over Sound)');
  const [rawFrame, setRawFrame] = useState('');
  const [decodedResult, setDecodedResult] = useState<DecodedPacket | null>(null);
  const [protocolError, setProtocolError] = useState<string | null>(null);

  // Live UTF-8 analysis
  const analysis = useMemo(() => {
    return analyzePayload(inputText);
  }, [inputText]);

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

  // Diagnostic Test Actions (Step 1)
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

  // Protocol Sandbox Actions (Step 2)
  const handleEncodeText = () => {
    setProtocolError(null);
    try {
      const frame = encodeTextPacket(inputText);
      setRawFrame(frame);
      setDecodedResult(null);
    } catch (err) {
      setProtocolError((err as Error).message);
    }
  };

  const handleSimulateFileHandshake = () => {
    setProtocolError(null);
    try {
      const frame = encodeFileRelayPacket('K9X2', 'dGhpcyBpcyBhIHRlc3Qga2V5');
      setRawFrame(frame);
      setDecodedResult(null);
    } catch (err) {
      setProtocolError((err as Error).message);
    }
  };

  const handleDecodeFrame = () => {
    setProtocolError(null);
    try {
      if (!rawFrame) {
        throw new Error('No acoustic frame available. Encode text or simulate handshake first.');
      }
      const decoded = decodePacket(rawFrame);
      setDecodedResult(decoded);
    } catch (err) {
      setProtocolError((err as Error).message);
      setDecodedResult(null);
    }
  };

  const handleTestCorruptedFrame = () => {
    setProtocolError(null);
    const corrupted = 'X:corrupted_noise';
    setRawFrame(corrupted);
    try {
      decodePacket(corrupted);
    } catch (err) {
      setProtocolError((err as Error).message);
      setDecodedResult(null);
    }
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
              PHASE 2 // PROTOCOL ENGINE ACTIVE
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
                ACOUSTIC PACKET PROTOCOL
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                STEP 02 READY
              </span>
            </div>
            <h2 className="text-xl font-medium tracking-tight text-zinc-100 mb-2">
              AirDrop Over Sound — Diagnostic & Protocol Inspector
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
              Zero-blur, flat matte dark minimal UI with real-time UTF-8 byte counting,
              dual-mode acoustic routing (<code className="text-zinc-300 bg-zinc-950 px-1 border border-zinc-800">T:</code> direct vs <code className="text-zinc-300 bg-zinc-950 px-1 border border-zinc-800">F:</code> relay),
              and pub/sub logging into the Debug Drawer below.
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

        {/* STEP 2: Protocol Inspector Sandbox Card */}
        <section className="mb-8">
          <div className="border border-zinc-800 bg-zinc-900 p-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-100">
                  Protocol Inspector // Packet Sandbox
                </h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                src/lib/protocol.ts
              </span>
            </div>

            {/* Input & Live Byte Counter */}
            <div className="space-y-3 mb-6">
              <label
                htmlFor="protocol-input"
                className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400"
              >
                Payload Input (Unicode & Emoji Aware)
              </label>

              <textarea
                id="protocol-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type text, emoji, key, or URL to analyze..."
                className="w-full h-24 bg-zinc-950 border border-zinc-800 focus:border-zinc-600 text-zinc-100 font-mono text-xs p-3 outline-none resize-none transition-colors"
              />

              {/* Byte Counter Telemetry Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-zinc-300">
                    <strong
                      className={
                        analysis.isWithinAcousticLimit
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }
                    >
                      {analysis.byteLength}
                    </strong>
                    <span className="text-zinc-500"> / </span>
                    <span className="text-zinc-400">{APP_CONFIG.MAX_ACOUSTIC_BYTES} BYTES</span>
                  </span>

                  <span className="text-[11px] font-mono text-zinc-500">
                    ({analysis.utilizationPercent}% utilization)
                  </span>
                </div>

                {/* Mode Indicator Badge */}
                <div>
                  {analysis.isWithinAcousticLimit ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-emerald-800 bg-zinc-950 text-emerald-400 font-mono text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      PURE_ACOUSTIC (Direct Sound)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-amber-800 bg-zinc-950 text-amber-400 font-mono text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      CLOUD_RELAY (Overflow Handshake)
                    </span>
                  )}
                </div>
              </div>

              {/* Crisp Progress Bar */}
              <div className="w-full h-1.5 bg-zinc-950 border border-zinc-800">
                <div
                  className={`h-full transition-all duration-150 ${
                    analysis.isWithinAcousticLimit
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (analysis.byteLength / APP_CONFIG.MAX_ACOUSTIC_BYTES) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Action Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-6">
              <button
                type="button"
                onClick={handleEncodeText}
                className="flex items-center justify-center gap-2 border border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900 active:bg-zinc-800 py-2.5 px-3 font-mono text-xs text-zinc-200 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Encode Text (T:)</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateFileHandshake}
                className="flex items-center justify-center gap-2 border border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900 active:bg-zinc-800 py-2.5 px-3 font-mono text-xs text-zinc-200 transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate Handshake (F:)</span>
              </button>

              <button
                type="button"
                onClick={handleDecodeFrame}
                className="flex items-center justify-center gap-2 border border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900 active:bg-zinc-800 py-2.5 px-3 font-mono text-xs text-zinc-200 transition-colors cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                <span>Decode Frame</span>
              </button>

              <button
                type="button"
                onClick={handleTestCorruptedFrame}
                className="flex items-center justify-center gap-2 border border-zinc-800 bg-zinc-950 hover:border-rose-900 hover:bg-zinc-900 active:bg-zinc-800 py-2.5 px-3 font-mono text-xs text-rose-300 transition-colors cursor-pointer"
              >
                <Bug className="w-3.5 h-3.5 text-rose-400" />
                <span>Corrupted Frame (X:)</span>
              </button>
            </div>

            {/* Error Telemetry (if any) */}
            {protocolError && (
              <div className="mb-4 border border-rose-800 bg-zinc-950 p-3 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-wider text-rose-400 mb-0.5">
                    PROTOCOL EXCEPTION CAUGHT
                  </div>
                  <div className="font-mono text-xs text-rose-200 break-all">
                    {protocolError}
                  </div>
                </div>
              </div>
            )}

            {/* Telemetry Output Boxes */}
            <div className="space-y-3">
              {/* Raw Frame Slot */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    Acoustic Frame Buffer (Over-the-Air Payload)
                  </span>
                  {rawFrame && (
                    <span className="text-[10px] font-mono text-zinc-500">
                      {rawFrame.length} chars
                    </span>
                  )}
                </div>
                <div className="border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs select-all break-all text-zinc-300 min-h-11 flex items-center">
                  {rawFrame ? (
                    <span className="text-emerald-400">{rawFrame}</span>
                  ) : (
                    <span className="text-zinc-600">// Click an encode or simulate action above</span>
                  )}
                </div>
              </div>

              {/* Decoded Structure Slot */}
              {decodedResult && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                    Decoded Packet Structure
                  </div>
                  <pre className="border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-200 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(decodedResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Diagnostic Buttons (Step 1) */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              System Diagnostics
            </h3>
            <span className="text-[11px] font-mono text-zinc-400">
              Step 1 Telemetry
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
