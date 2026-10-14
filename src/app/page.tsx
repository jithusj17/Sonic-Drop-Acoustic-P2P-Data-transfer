'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Send,
  Radio,
  ChevronDown,
  ChevronUp,
  Activity,
  Volume2,
  ShieldCheck,
  AlertTriangle,
  Code2,
  Bug,
  FileText,
  KeyRound,
  ArrowRight,
  Wrench,
} from 'lucide-react';
import { APP_CONFIG } from '@/config/constants';
import { logger } from '@/lib/logger';
import {
  analyzePayload,
  decodePacket,
  encodeFileRelayPacket,
  encodeTextPacket,
} from '@/lib/protocol';
import { AudioProtocol, DecodedPacket, ReceivedItem } from '@/types';
import { Header } from '@/components/Header';
import { TransmitterView } from '@/components/transmitter/TransmitterView';
import { ReceiverView } from '@/components/receiver/ReceiverView';
import { Spectrogram } from '@/components/visualizer/Spectrogram';
import { DebugDrawer } from '@/components/debug/DebugDrawer';

export default function HomePage() {
  // Global Protocol Configuration
  const [protocol, setProtocol] = useState<AudioProtocol>('AUDIBLE_FAST');

  // Main UI Shell Tab Navigation
  const [activeTab, setActiveTab] = useState<'TRANSMIT' | 'LISTEN'>('TRANSMIT');

  // Receiver Feed State
  const [receivedItems, setReceivedItems] = useState<ReceivedItem[]>([
    {
      id: 'demo-1',
      timestamp: '12:00:00 PM',
      type: 'TEXT',
      content: 'Welcome to SonicDrop! AirDrop over Sound ready.',
      byteLength: 46,
      protocol: 'AUDIBLE_FAST',
    },
  ]);

  // Collapsible Developer Tools Accordion
  const [showDevTools, setShowDevTools] = useState(false);

  // Step 2 Protocol Sandbox State
  const [sandboxInput, setSandboxInput] = useState(
    'Hello SonicDrop! 🚀 (AirDrop over Sound)'
  );
  const [rawFrame, setRawFrame] = useState('');
  const [decodedResult, setDecodedResult] = useState<DecodedPacket | null>(null);
  const [protocolError, setProtocolError] = useState<string | null>(null);

  const sandboxAnalysis = useMemo(() => {
    return analyzePayload(sandboxInput);
  }, [sandboxInput]);

  // Initial Boot Log
  useEffect(() => {
    logger.info(
      'SYSTEM',
      `${APP_CONFIG.APP_NAME} v0.5 Visualizer & Microphone active.`,
      {
        sampleRate: `${APP_CONFIG.SAMPLE_RATE} Hz`,
        protocol,
        maxBytes: `${APP_CONFIG.MAX_ACOUSTIC_BYTES} B`,
      }
    );
  }, []);

  // Handlers for Receiver Feed
  const handleAddItem = (item: ReceivedItem) => {
    setReceivedItems((prev) => [item, ...prev]);
  };

  const handleClearItems = () => {
    setReceivedItems([]);
    logger.info('SYSTEM', 'Cleared received payloads feed');
  };

  // Cross-view Transmission Pipe: When user broadcasts, optionally append to receiver feed
  const handleTransmittedItem = (item: ReceivedItem) => {
    setReceivedItems((prev) => [item, ...prev]);
  };

  // Step 1 Diagnostics
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
      `Simulated AudioContext probe: 48,000 Hz, activeProtocol=${protocol}`,
      {
        sampleRate: APP_CONFIG.SAMPLE_RATE,
        band:
          protocol === 'AUDIBLE_FAST'
            ? '1,800 - 4,500 Hz'
            : '18,500 - 20,000 Hz',
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

  // Step 2 Protocol Sandbox Actions
  const handleEncodeText = () => {
    setProtocolError(null);
    try {
      const frame = encodeTextPacket(sandboxInput);
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
      {/* Production Minimalist Header with Audio Protocol Switcher */}
      <Header protocol={protocol} onProtocolChange={setProtocol} />

      {/* Main App Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 pb-72 space-y-6">
        {/* Subtitle / Mode Status Strip */}
        <div className="border border-zinc-800 bg-zinc-900 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-mono tracking-wider text-zinc-200">
              ACOUSTIC P2P DATA TRANSFER // AIRDROP OVER SOUND
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-400">
            <span>BAND: {protocol === 'AUDIBLE_FAST' ? '1.8k–4.5kHz' : '18.5kHz+'}</span>
            <span>•</span>
            <span>MAX ACOUSTIC: {APP_CONFIG.MAX_ACOUSTIC_BYTES}B</span>
          </div>
        </div>

        {/* Real-Time 60fps Acoustic Spectrogram Visualizer (Step 5) */}
        <section>
          <Spectrogram protocol={protocol} />
        </section>

        {/* 2-Tab Switcher: [ 01 // TRANSMIT ] and [ 02 // LISTEN ] */}
        <nav aria-label="Mode selection" className="grid grid-cols-2 gap-2 border-b border-zinc-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('TRANSMIT')}
            className={`py-3 px-4 flex items-center justify-center gap-2.5 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer select-none border ${
              activeTab === 'TRANSMIT'
                ? 'bg-zinc-900 border-zinc-700 text-zinc-100 font-medium'
                : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span>[ 01 // TRANSMIT ]</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LISTEN')}
            className={`py-3 px-4 flex items-center justify-center gap-2.5 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer select-none border ${
              activeTab === 'LISTEN'
                ? 'bg-zinc-900 border-zinc-700 text-zinc-100 font-medium'
                : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-amber-400" />
            <span>[ 02 // LISTEN ]</span>
            {receivedItems.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-zinc-800 border border-zinc-700 text-zinc-300">
                {receivedItems.length}
              </span>
            )}
          </button>
        </nav>

        {/* Primary Workspace View */}
        <section>
          {activeTab === 'TRANSMIT' ? (
            <TransmitterView
              protocol={protocol}
              onItemTransmitted={handleTransmittedItem}
            />
          ) : (
            <ReceiverView
              protocol={protocol}
              items={receivedItems}
              onAddItem={handleAddItem}
              onClearItems={handleClearItems}
            />
          )}
        </section>

        {/* Collapsible Developer Protocol & Diagnostics Tools */}
        <section className="border border-zinc-800 bg-zinc-900/60 transition-colors">
          <button
            type="button"
            onClick={() => setShowDevTools((prev) => !prev)}
            className="w-full p-4 flex items-center justify-between text-left font-mono text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-zinc-500" />
              <span className="uppercase tracking-wider">
                Developer Protocol Sandbox & Diagnostics
              </span>
              <span className="text-[10px] text-zinc-500">// STEP 1 & 2 TOOLS</span>
            </div>
            {showDevTools ? (
              <ChevronUp className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            )}
          </button>

          {showDevTools && (
            <div className="p-5 pt-0 space-y-6 border-t border-zinc-800">
              {/* Step 2 Protocol Inspector */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-200">
                      Packet Protocol Tester (protocol.ts)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">
                    Cap: {APP_CONFIG.MAX_ACOUSTIC_BYTES}B
                  </span>
                </div>

                <div className="space-y-2">
                  <textarea
                    value={sandboxInput}
                    onChange={(e) => setSandboxInput(e.target.value)}
                    placeholder="Type raw text to test packet encoder..."
                    className="w-full h-20 bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-xs p-3 outline-none resize-none focus:border-zinc-700"
                  />

                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span>
                      Length: {sandboxAnalysis.byteLength} / {APP_CONFIG.MAX_ACOUSTIC_BYTES} B ({sandboxAnalysis.utilizationPercent}%)
                    </span>
                    <span
                      className={
                        sandboxAnalysis.isWithinAcousticLimit
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }
                    >
                      Mode: {sandboxAnalysis.recommendedMode}
                    </span>
                  </div>
                </div>

                {/* Sandbox Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={handleEncodeText}
                    className="p-2 border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 font-mono text-xs text-zinc-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Encode (T:)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSimulateFileHandshake}
                    className="p-2 border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 font-mono text-xs text-zinc-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Handshake (F:)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDecodeFrame}
                    className="p-2 border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 font-mono text-xs text-zinc-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Decode</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestCorruptedFrame}
                    className="p-2 border border-zinc-800 bg-zinc-950 hover:border-rose-900 hover:bg-zinc-900 font-mono text-xs text-rose-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Bug className="w-3.5 h-3.5 text-rose-400" />
                    <span>Corrupt (X:)</span>
                  </button>
                </div>

                {/* Sandbox Output */}
                {protocolError && (
                  <div className="p-2.5 border border-rose-800 bg-zinc-950 text-rose-400 font-mono text-xs">
                    {protocolError}
                  </div>
                )}

                {rawFrame && (
                  <div className="p-2.5 border border-zinc-800 bg-zinc-950 font-mono text-xs text-emerald-400 break-all select-all">
                    {rawFrame}
                  </div>
                )}

                {decodedResult && (
                  <pre className="p-2.5 border border-zinc-800 bg-zinc-950 font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(decodedResult, null, 2)}
                  </pre>
                )}
              </div>

              {/* Step 1 Diagnostic Buttons */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block">
                  Subsystem Log Telemetry Tests
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={handleTestSystem}
                    className="p-2 border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 font-mono text-xs text-zinc-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Activity className="w-3.5 h-3.5 text-zinc-400" />
                    <span>System</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestAudio}
                    className="p-2 border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 font-mono text-xs text-zinc-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Audio</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestCrypto}
                    className="p-2 border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 font-mono text-xs text-zinc-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Crypto</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestError}
                    className="p-2 border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 font-mono text-xs text-rose-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Error</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Persistent Developer Bottom Console */}
      <DebugDrawer />
    </div>
  );
}
