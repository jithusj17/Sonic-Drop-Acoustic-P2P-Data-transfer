'use client';

import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  Sparkles,
  Trash2,
  Inbox,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { AudioProtocol, ReceivedItem, ReceiverState } from '@/types';
import { logger } from '@/lib/logger';
import { useAcoustic } from '@/hooks/useAcoustic';
import { PayloadCard } from './PayloadCard';

interface ReceiverViewProps {
  protocol: AudioProtocol;
  items: ReceivedItem[];
  onAddItem: (item: ReceivedItem) => void;
  onClearItems: () => void;
}

export function ReceiverView({
  protocol,
  items,
  onAddItem,
  onClearItems,
}: ReceiverViewProps) {
  const { isListening, startListening, stopListening } = useAcoustic();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationIndex, setSimulationIndex] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const effectiveState: ReceiverState = isSimulating
    ? 'SIGNAL_LOCKED'
    : isListening
    ? 'LISTENING'
    : 'IDLE';

  // Toggle Hardware Microphone Listening (Step 5)
  const handleToggleListening = async () => {
    setMicError(null);
    if (!isListening) {
      try {
        await startListening();
      } catch (err) {
        const errorMsg =
          (err as Error).name === 'NotAllowedError'
            ? 'Microphone permission denied by user'
            : (err as Error).message;
        setMicError(errorMsg);
      }
    } else {
      stopListening();
    }
  };

  // Simulate Incoming Signal (Step 3 & Step 5 verification)
  const handleSimulateIncoming = () => {
    setIsSimulating(true);

    const sampleSignals = [
      {
        type: 'TEXT' as const,
        content: 'https://github.com/jithusj17/Sonic-Drop-Acoustic-P2P-Data-transfer',
        byteLength: 68,
      },
      {
        type: 'FILE_RELAY' as const,
        content: 'firmware_update_v2.bin',
        byteLength: 52,
        fileSize: 4194304, // 4 MB
      },
      {
        type: 'TEXT' as const,
        content: 'WiFi: SonicDrop-Office // Key: acoustics#48000',
        byteLength: 46,
      },
      {
        type: 'FILE_RELAY' as const,
        content: 'spectrogram_capture_raw.wav',
        byteLength: 52,
        fileSize: 1572864, // 1.5 MB
      },
    ];

    const pick = sampleSignals[simulationIndex % sampleSignals.length];
    setSimulationIndex((prev) => prev + 1);

    logger.info('PROTOCOL', 'Acoustic preamble detected: Locking carrier phase', {
      carrierSnr: '+14.2 dB',
      protocol,
    });

    setTimeout(() => {
      const newItem: ReceivedItem = {
        id: `rx-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: pick.type,
        content: pick.content,
        byteLength: pick.byteLength,
        protocol,
        fileSize: pick.fileSize,
      };

      onAddItem(newItem);
      setIsSimulating(false);

      logger.success('PROTOCOL', `Incoming acoustic burst decoded: ${pick.type}`, {
        item: newItem,
      });
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Receiver Control Console */}
      <div className="border border-zinc-800 bg-zinc-900 p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-100">
              RECEIVER // ACOUSTIC DEMODULATOR
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                effectiveState === 'IDLE'
                  ? 'bg-zinc-600'
                  : effectiveState === 'LISTENING'
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="text-[11px] font-mono text-zinc-400 uppercase">
              STATUS: {effectiveState}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Main Microphone Toggle Button */}
          <button
            type="button"
            onClick={handleToggleListening}
            className={`py-3 px-4 flex items-center justify-center gap-2 font-mono text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer select-none border ${
              !isListening
                ? 'bg-zinc-950 border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900 text-zinc-100'
                : 'bg-emerald-950/40 border-emerald-700 text-emerald-400 hover:bg-emerald-950/60'
            }`}
          >
            {!isListening ? (
              <>
                <Mic className="w-4 h-4 text-zinc-400" />
                <span>Start Listening (Microphone)</span>
              </>
            ) : (
              <>
                <MicOff className="w-4 h-4 text-emerald-400" />
                <span>Stop Listening</span>
              </>
            )}
          </button>

          {/* Test Simulation Button */}
          <button
            type="button"
            onClick={handleSimulateIncoming}
            className="py-3 px-4 flex items-center justify-center gap-2 font-mono text-xs font-medium uppercase tracking-wider bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300 transition-colors cursor-pointer select-none"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Simulate Incoming Signal</span>
          </button>
        </div>

        {/* Error Feedback Strip (e.g. Permission Denied) */}
        {micError && (
          <div className="border border-rose-800 bg-zinc-950 p-3 flex items-start gap-2.5 text-rose-400 font-mono text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold uppercase text-[10px] tracking-wider mb-0.5">
                Microphone Access Denied / Unavailable
              </p>
              <p className="text-rose-200">{micError}</p>
            </div>
          </div>
        )}

        {/* Live Audio Telemetry Strip */}
        <div className="border border-zinc-800 bg-zinc-950 p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-400">
            <Activity className="w-3.5 h-3.5 text-zinc-500" />
            <span>DEMODULATION BAND:</span>
            <span className="text-zinc-200">
              {protocol === 'AUDIBLE_FAST' ? '1,800 – 4,500 Hz' : '18,500 – 20,000 Hz'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-zinc-500">
            <span>MIC: {isListening ? 'STREAM LOCKED' : 'STANDBY'}</span>
            <span>•</span>
            <span>FSK READY</span>
          </div>
        </div>
      </div>

      {/* Received Payloads Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-zinc-400" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-300">
              Received Payloads ({items.length})
            </h3>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={onClearItems}
              className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Feed</span>
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="border border-zinc-800 bg-zinc-900/60 p-10 flex flex-col items-center justify-center text-center space-y-2 select-none">
            <Radio className="w-8 h-8 text-zinc-700" />
            <p className="text-xs font-mono tracking-widest text-zinc-500 uppercase">
              // NO SIGNALS DETECTED
            </p>
            <p className="text-[11px] font-mono text-zinc-600 max-w-sm">
              Click &quot;Start Listening&quot; and bring a transmitting device close, or
              click &quot;Simulate Incoming Signal&quot; to test the decoder feed.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <PayloadCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
