'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Activity, Radio } from 'lucide-react';
import { acousticEngine } from '@/services/acousticEngine';
import { AudioProtocol } from '@/types';

interface SpectrogramProps {
  protocol: AudioProtocol;
}

export function Spectrogram({ protocol }: SpectrogramProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // HUD telemetry state (updated throttled ~10fps to avoid React render churn)
  const [hudState, setHudState] = useState<{
    peakHz: number;
    decibels: number;
    mode: 'SPEAKER TX' | 'MIC RX' | 'STANDBY';
  }>({
    peakHz: 0,
    decibels: -100,
    mode: 'STANDBY',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastHudUpdate = 0;

    // Fixed buffers for 60fps extraction (zero garbage collection overhead)
    const freqBuffer = new Uint8Array(1024);
    const timeBuffer = new Uint8Array(1024);

    const handleResize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    handleResize();
    const resizeObserver = new ResizeObserver(() => handleResize());
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);

      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      if (width === 0 || height === 0) return;

      const isPlaying = acousticEngine.getIsPlaying();
      const isMicActive = acousticEngine.getIsMicActive();
      const isAudioActive = isPlaying || isMicActive;

      // 1. Fetch live telemetry from AcousticEngine singleton
      if (isAudioActive) {
        acousticEngine.getFrequencyData(freqBuffer);
        acousticEngine.getTimeDomainData(timeBuffer);
      } else {
        freqBuffer.fill(0);
        timeBuffer.fill(128); // 128 is center DC bias for 8-bit PCM
      }

      // Throttled HUD telemetry updates (~10fps)
      if (time - lastHudUpdate > 100) {
        lastHudUpdate = time;
        const peak = acousticEngine.getPeakFrequencyHz();
        const mode = isPlaying
          ? ('SPEAKER TX' as const)
          : isMicActive
          ? ('MIC RX' as const)
          : ('STANDBY' as const);

        setHudState({
          peakHz: peak.freqHz,
          decibels: peak.decibels,
          mode,
        });
      }

      // 2. Clear background to pure matte dark #09090B
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);

      // 3. Technical Grid & Frequency Markers
      // Sample rate = 48000 Hz -> Nyquist frequency = 24000 Hz
      const nyquistHz = 24000;
      const markers = [
        { freq: 1000, label: '1k' },
        { freq: 4000, label: '4k' },
        { freq: 12000, label: '12k' },
        { freq: 18500, label: '18.5k (ULTRASOUND)', isHighlight: true },
      ];

      // Draw horizontal dB grid lines
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1;
      for (let y = 1; y <= 3; y++) {
        const yPos = (height / 4) * y;
        ctx.beginPath();
        ctx.moveTo(0, yPos);
        ctx.lineTo(width, yPos);
        ctx.stroke();
      }

      // Draw vertical frequency marker lines
      markers.forEach(({ freq, label, isHighlight }) => {
        const x = (freq / nyquistHz) * width;
        ctx.beginPath();
        if (isHighlight) {
          ctx.strokeStyle = '#27272a';
          ctx.setLineDash([3, 3]);
        } else {
          ctx.strokeStyle = '#18181b';
          ctx.setLineDash([]);
        }
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Frequency Label
        ctx.fillStyle = isHighlight ? '#a1a1aa' : '#52525b';
        ctx.font = '9px monospace';
        ctx.fillText(label, x + 3, height - 5);
      });

      // 4. Draw FFT Frequency Bars
      // Display up to 128 bins (covering up to ~24kHz)
      const numBins = 128;
      const barWidth = width / numBins;

      for (let i = 0; i < numBins; i++) {
        // Map bin to frequency index
        const binIndex = Math.floor((i / numBins) * (freqBuffer.length * 0.85));
        const val = freqBuffer[binIndex] || 0;
        const barHeight = (val / 255) * (height - 24);

        if (barHeight > 1) {
          const binHz = (i / numBins) * nyquistHz;

          // Color palette logic (strict solid colors, no gradients)
          if (binHz >= 18000) {
            ctx.fillStyle = '#f59e0b'; // Amber for Ultrasonic
          } else if (binHz >= 1500 && binHz <= 4500) {
            ctx.fillStyle = '#10b981'; // Emerald for Audible FSK
          } else {
            ctx.fillStyle = '#3f3f46'; // Muted zinc
          }

          const x = i * barWidth;
          const y = height - barHeight - 14;
          ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
        }
      }

      // 5. Draw Time-Domain Waveform Line
      ctx.beginPath();
      ctx.lineWidth = 1;
      if (isAudioActive) {
        ctx.strokeStyle = protocol === 'ULTRASONIC_STEALTH' ? '#f59e0b' : '#10b981';
      } else {
        ctx.strokeStyle = '#27272a';
      }

      const sliceWidth = width / (timeBuffer.length / 2);
      let x = 0;

      for (let i = 0; i < timeBuffer.length / 2; i++) {
        const v = timeBuffer[i] / 128.0; // 0.0 to 2.0
        const y = (v * (height - 30)) / 2 + 10;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }
      ctx.stroke();
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [protocol]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-36 border border-zinc-800 bg-zinc-950 select-none overflow-hidden"
    >
      {/* 60fps Web Audio Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Top Left Title Overlay */}
      <div className="absolute top-2.5 left-3 flex items-center gap-2 pointer-events-none">
        <Activity className="w-3.5 h-3.5 text-zinc-400" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-300">
          ACOUSTIC SPECTRUM // 0 - 24 kHz (48kHz NYQUIST)
        </span>
      </div>

      {/* Top Right Real-Time Telemetry HUD */}
      <div className="absolute top-2.5 right-3 flex items-center gap-2.5 pointer-events-none font-mono text-[11px]">
        {/* Peak Frequency */}
        <div className="flex items-center gap-1 text-zinc-400 bg-zinc-900/90 border border-zinc-800 px-2 py-0.5">
          <span className="text-zinc-500 text-[10px]">PEAK:</span>
          <span
            className={
              hudState.peakHz >= 18000
                ? 'text-amber-400 font-medium'
                : hudState.peakHz > 0
                ? 'text-emerald-400 font-medium'
                : 'text-zinc-500'
            }
          >
            {hudState.peakHz > 0 ? `${hudState.peakHz.toLocaleString()} Hz` : '-- Hz'}
          </span>
        </div>

        {/* Signal Level dB */}
        <div className="hidden sm:flex items-center gap-1 text-zinc-400 bg-zinc-900/90 border border-zinc-800 px-2 py-0.5">
          <span className="text-zinc-500 text-[10px]">LVL:</span>
          <span className="text-zinc-300">
            {hudState.decibels > -100 ? `${hudState.decibels} dB` : '-∞ dB'}
          </span>
        </div>

        {/* Operating Mode Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 border ${
            hudState.mode === 'SPEAKER TX'
              ? 'border-emerald-800 bg-zinc-900/90 text-emerald-400'
              : hudState.mode === 'MIC RX'
              ? 'border-emerald-800 bg-zinc-900/90 text-emerald-400'
              : 'border-zinc-800 bg-zinc-900/90 text-zinc-500'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              hudState.mode === 'SPEAKER TX'
                ? 'bg-emerald-500 animate-pulse'
                : hudState.mode === 'MIC RX'
                ? 'bg-emerald-500 animate-ping'
                : 'bg-zinc-600'
            }`}
          />
          <span className="text-[10px] font-medium tracking-wider">
            {hudState.mode}
          </span>
        </div>
      </div>
    </div>
  );
}
