'use client';

import { useCallback, useEffect, useState } from 'react';
import { acousticEngine, AudioDiagnostics } from '@/services/acousticEngine';
import { AudioProtocol } from '@/types';

export function useAcoustic() {
  const [diagnostics, setDiagnostics] = useState<AudioDiagnostics>(
    acousticEngine.getDiagnostics()
  );
  const [engineState, setEngineState] = useState<AudioContextState | 'UNINITIALIZED'>(
    diagnostics.state
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = acousticEngine.subscribe((diag) => {
      setDiagnostics(diag);
      setEngineState(diag.state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const initAudio = useCallback(async () => {
    const ctx = await acousticEngine.initContext();
    if (ctx) {
      setDiagnostics(acousticEngine.getDiagnostics());
      setEngineState(ctx.state);
    }
    return ctx;
  }, []);

  const testSpeaker = useCallback(
    async (protocol: AudioProtocol, durationMs = 600) => {
      try {
        setIsPlaying(true);
        await acousticEngine.playCalibrationTone(protocol, durationMs);
      } finally {
        setIsPlaying(false);
        setDiagnostics(acousticEngine.getDiagnostics());
      }
    },
    []
  );

  return {
    engineState,
    diagnostics,
    isPlaying,
    initAudio,
    testSpeaker,
  };
}
