'use client';

import React from 'react';
import { Radio, Volume2 } from 'lucide-react';
import { AudioProtocol } from '@/types';
import { logger } from '@/lib/logger';
import { useAcoustic } from '@/hooks/useAcoustic';

interface HeaderProps {
  protocol: AudioProtocol;
  onProtocolChange: (protocol: AudioProtocol) => void;
}

export function Header({ protocol, onProtocolChange }: HeaderProps) {
  const { engineState, isPlaying, testSpeaker } = useAcoustic();

  const handleProtocolSelect = (newProtocol: AudioProtocol) => {
    if (newProtocol === protocol) return;

    const band =
      newProtocol === 'AUDIBLE_FAST'
        ? '1.8 kHz - 4.5 kHz (Audible FSK)'
        : '18.5 kHz - 20.0 kHz (Near-Ultrasound Stealth)';

    logger.info('AUDIO', `Audio protocol switched to ${newProtocol}`, {
      protocol: newProtocol,
      frequencyBand: band,
    });

    onProtocolChange(newProtocol);
  };

  const handleTestSpeaker = async () => {
    logger.info(
      'AUDIO',
      `Manual speaker calibration triggered: ${protocol === 'AUDIBLE_FAST' ? 'Audible chime' : 'Ultrasonic burst'}`
    );
    await testSpeaker(protocol, 600);
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950 px-4 py-3 sticky top-0 z-40 select-none">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand Mark & Hardware Status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-wider text-zinc-100 uppercase">
              SonicDrop
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400">
              v0.4
            </span>
          </div>

          {/* Live AudioContext Status Badge */}
          <div className="hidden sm:flex items-center">
            {engineState === 'running' ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-emerald-800 bg-zinc-900 text-emerald-400 font-mono text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                48kHz READY
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-zinc-800 bg-zinc-900 text-zinc-500 font-mono text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                AUDIO STANDBY
              </span>
            )}
          </div>
        </div>

        {/* Controls: Speaker Test Button + Protocol Segmented Switcher */}
        <div className="flex items-center gap-2">
          {/* Test Speaker Button */}
          <button
            type="button"
            onClick={handleTestSpeaker}
            disabled={isPlaying}
            title={`Play ${protocol === 'AUDIBLE_FAST' ? 'audible chime' : 'ultrasonic tone'} through speaker`}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono border transition-colors cursor-pointer ${
              isPlaying
                ? 'bg-zinc-800 border-emerald-700 text-emerald-400'
                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300'
            }`}
          >
            <Volume2
              className={`w-3.5 h-3.5 ${
                isPlaying ? 'text-emerald-400 animate-pulse' : 'text-zinc-400'
              }`}
            />
            <span>{isPlaying ? 'PLAYING...' : 'TEST SPEAKER'}</span>
          </button>

          {/* Protocol Switcher */}
          <div className="inline-flex items-center p-0.5 bg-zinc-900 border border-zinc-800">
            {/* Audible Protocol Button */}
            <button
              type="button"
              onClick={() => handleProtocolSelect('AUDIBLE_FAST')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono transition-colors cursor-pointer border ${
                protocol === 'AUDIBLE_FAST'
                  ? 'bg-zinc-950 border-zinc-700 text-zinc-100 font-medium'
                  : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  protocol === 'AUDIBLE_FAST' ? 'bg-emerald-500' : 'bg-zinc-600'
                }`}
              />
              <span>AUDIBLE (1.8k–4.5k)</span>
            </button>

            {/* Ultrasonic Protocol Button */}
            <button
              type="button"
              onClick={() => handleProtocolSelect('ULTRASONIC_STEALTH')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono transition-colors cursor-pointer border ${
                protocol === 'ULTRASONIC_STEALTH'
                  ? 'bg-zinc-950 border-zinc-700 text-zinc-100 font-medium'
                  : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  protocol === 'ULTRASONIC_STEALTH' ? 'bg-amber-500' : 'bg-zinc-600'
                }`}
              />
              <span>ULTRASONIC (18.5k+)</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
