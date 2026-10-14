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
  const [isPlaying, setIsPlaying] = useState<boolean>(diagnostics.isPlaying);
  const [isListening, setIsListening] = useState<boolean>(diagnostics.isMicActive);

  useEffect(() => {
    const unsubscribe = acousticEngine.subscribe((diag) => {
      setDiagnostics(diag);
      setEngineState(diag.state);
      setIsPlaying(diag.isPlaying);
      setIsListening(diag.isMicActive);
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

  const startListening = useCallback(async () => {
    try {
      await acousticEngine.startMicrophone();
      setIsListening(true);
    } finally {
      setDiagnostics(acousticEngine.getDiagnostics());
    }
  }, []);

  const stopListening = useCallback(() => {
    acousticEngine.stopMicrophone();
    setIsListening(false);
    setDiagnostics(acousticEngine.getDiagnostics());
  }, []);

  const getFrequencyData = useCallback((targetBuffer: Uint8Array) => {
    return acousticEngine.getFrequencyData(targetBuffer);
  }, []);

  const getTimeDomainData = useCallback((targetBuffer: Uint8Array) => {
    return acousticEngine.getTimeDomainData(targetBuffer);
  }, []);

  const getPeakFrequencyHz = useCallback(() => {
    return acousticEngine.getPeakFrequencyHz();
  }, []);

  return {
    engineState,
    diagnostics,
    isPlaying,
    isListening,
    initAudio,
    testSpeaker,
    startListening,
    stopListening,
    getFrequencyData,
    getTimeDomainData,
    getPeakFrequencyHz,
    acousticEngine,
  };
}
