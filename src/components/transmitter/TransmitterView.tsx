'use client';

import React, { useMemo, useRef, useState } from 'react';
import {
  Upload,
  File,
  X,
  Radio,
  Send,
  CheckCircle2,
  AlertCircle,
  Paperclip,
} from 'lucide-react';
import { APP_CONFIG } from '@/config/constants';
import { logger } from '@/lib/logger';
import {
  analyzePayload,
  encodeFileRelayPacket,
  encodeTextPacket,
} from '@/lib/protocol';
import { AudioProtocol, ReceivedItem, TransmitterState } from '@/types';

interface TransmitterViewProps {
  protocol: AudioProtocol;
  onItemTransmitted?: (item: ReceivedItem) => void;
}

export function TransmitterView({
  protocol,
  onItemTransmitted,
}: TransmitterViewProps) {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [transmitterState, setTransmitterState] = useState<TransmitterState>('IDLE');
  const [lastBroadcastPacket, setLastBroadcastPacket] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live UTF-8 analysis accounting for file attachment
  const analysis = useMemo(() => {
    return analyzePayload(text, !!selectedFile);
  }, [text, selectedFile]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // File Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      logger.info('SYSTEM', `File staged for relay: "${file.name}"`, {
        size: formatFileSize(file.size),
        type: file.type || 'application/octet-stream',
      });
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      logger.info('SYSTEM', `File dropped for relay: "${file.name}"`, {
        size: formatFileSize(file.size),
        type: file.type || 'application/octet-stream',
      });
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Broadcast Action Simulation (Step 3)
  const handleBroadcast = () => {
    if (!text.trim() && !selectedFile) return;

    try {
      let packet = '';
      let transmittedItem: ReceivedItem;

      if (selectedFile) {
        // Generate mock 4-char token & IV for cloud relay handshake
        const mockToken = Math.random().toString(36).substring(2, 6).toUpperCase();
        const mockKeyIv = 'mockKeyIvBase64StringForStep3==';
        packet = encodeFileRelayPacket(mockToken, mockKeyIv);

        transmittedItem = {
          id: `item-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'FILE_RELAY',
          content: selectedFile.name,
          byteLength: packet.length,
          protocol,
          fileSize: selectedFile.size,
        };
      } else {
        // Pure acoustic text packet
        packet = encodeTextPacket(text);

        transmittedItem = {
          id: `item-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'TEXT',
          content: text.trim(),
          byteLength: packet.length,
          protocol,
        };
      }

      setLastBroadcastPacket(packet);

      // Step 3: Run simulated 2-second acoustic transmission cycle
      setTransmitterState('ENCODING_AUDIO');
      logger.info('AUDIO', `Synthesizing acoustic carrier frame (${protocol})`, {
        packet,
        mode: analysis.recommendedMode,
      });

      setTimeout(() => {
        setTransmitterState('BROADCASTING');
        logger.info(
          'PROTOCOL',
          `Emitting acoustic audio bursts over speaker (${protocol})`,
          {
            packet,
            bytes: packet.length,
            durationEst: '1.4s',
          }
        );

        setTimeout(() => {
          setTransmitterState('COMPLETED');
          logger.success('PROTOCOL', 'Acoustic broadcast completed', {
            packet,
            mode: analysis.recommendedMode,
          });

          if (onItemTransmitted) {
            onItemTransmitted(transmittedItem);
          }

          // Reset to IDLE after 2.5s
          setTimeout(() => {
            setTransmitterState('IDLE');
          }, 2500);
        }, 1200);
      }, 800);
    } catch (err) {
      setTransmitterState('IDLE');
      logger.error('PROTOCOL', `Broadcast failed: ${(err as Error).message}`);
    }
  };

  const isActionDisabled =
    (!text.trim() && !selectedFile) || transmitterState !== 'IDLE';

  return (
    <div className="space-y-6">
      {/* Transmitter Card */}
      <div className="border border-zinc-800 bg-zinc-900 p-6 space-y-5">
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-100">
              TRANSMITTER // AIR ENCODER
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            PROTOCOL: {protocol === 'AUDIBLE_FAST' ? 'AUDIBLE (48kHz)' : 'ULTRASOUND (19kHz)'}
          </span>
        </div>

        {/* Text Input Area */}
        <div className="space-y-2">
          <label
            htmlFor="transmitter-text"
            className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400"
          >
            Payload Text, Message, or URL
          </label>
          <textarea
            id="transmitter-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={transmitterState !== 'IDLE'}
            placeholder="Type text, secrets, contact info, or paste link..."
            className="w-full h-28 bg-zinc-950 border border-zinc-800 focus:border-zinc-600 disabled:opacity-60 text-zinc-100 font-mono text-xs p-3 outline-none resize-none transition-colors"
          />
        </div>

        {/* File Attachment Dropzone / Bar */}
        <div className="space-y-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={transmitterState !== 'IDLE'}
            className="hidden"
          />

          {!selectedFile ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed p-3.5 flex items-center justify-center gap-2.5 transition-colors cursor-pointer select-none ${
                isDragging
                  ? 'border-emerald-500 bg-zinc-950'
                  : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-950'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-mono text-zinc-300">
                Attach file for Cloud Relay handover (or drag & drop here)
              </span>
            </div>
          ) : (
            <div className="border border-zinc-800 bg-zinc-950 p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <File className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-mono text-zinc-200 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500">
                    {formatFileSize(selectedFile.size)} // Ephemeral Cloud Relay Handshake
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={transmitterState !== 'IDLE'}
                title="Remove attached file"
                className="p-1 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Live Protocol Telemetry Bar */}
        <div className="border border-zinc-800/80 bg-zinc-950 p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
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
                <span className="text-zinc-400">
                  {APP_CONFIG.MAX_ACOUSTIC_BYTES} BYTES
                </span>
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                ({analysis.utilizationPercent}%)
              </span>
            </div>

            {/* Mode Badge */}
            <div>
              {analysis.isWithinAcousticLimit ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-emerald-800 bg-zinc-900 text-emerald-400 font-mono text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ⚡ PURE_ACOUSTIC (OFFLINE SOUND)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-amber-800 bg-zinc-900 text-amber-400 font-mono text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  🔐 CLOUD_RELAY (AES-GCM + ACOUSTIC KEY)
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-zinc-900 border border-zinc-800">
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

        {/* Primary Action Button */}
        <div>
          <button
            type="button"
            onClick={handleBroadcast}
            disabled={isActionDisabled}
            className={`w-full py-3 px-4 flex items-center justify-center gap-2 font-mono text-xs font-medium uppercase tracking-wider transition-colors cursor-pointer select-none ${
              transmitterState === 'IDLE'
                ? 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-zinc-950 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed'
                : transmitterState === 'ENCODING_AUDIO'
                ? 'bg-zinc-800 text-amber-400 border border-amber-800/60'
                : transmitterState === 'BROADCASTING'
                ? 'bg-emerald-500 text-zinc-950 animate-pulse'
                : 'bg-emerald-400 text-zinc-950'
            }`}
          >
            {transmitterState === 'IDLE' && (
              <>
                <Send className="w-4 h-4" />
                <span>Broadcast Signal Over Sound</span>
              </>
            )}

            {transmitterState === 'ENCODING_AUDIO' && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Encoding FSK Audio Frame...</span>
              </>
            )}

            {transmitterState === 'BROADCASTING' && (
              <>
                <Radio className="w-4 h-4 animate-spin" />
                <span>Broadcasting Acoustic Bursts...</span>
              </>
            )}

            {transmitterState === 'COMPLETED' && (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Broadcast Completed</span>
              </>
            )}
          </button>
        </div>

        {/* Last Broadcast Buffer Feedback */}
        {lastBroadcastPacket && (
          <div className="pt-2 border-t border-zinc-800/80">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Last Emitted Acoustic Packet
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {lastBroadcastPacket.length} B
              </span>
            </div>
            <div className="border border-zinc-800 bg-zinc-950 p-2.5 font-mono text-xs text-emerald-400 break-all select-all">
              {lastBroadcastPacket}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
