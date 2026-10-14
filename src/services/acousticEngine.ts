import { RAW_AUDIO_CONSTRAINTS } from '@/config/audioConstraints';
import { APP_CONFIG } from '@/config/constants';
import { logger } from '@/lib/logger';
import { AudioProtocol } from '@/types';

export interface AudioDiagnostics {
  state: AudioContextState | 'UNINITIALIZED';
  sampleRate: number | null;
  baseLatency: number | null;
  isMicActive: boolean;
  isPlaying: boolean;
}

type AudioStateListener = (diag: AudioDiagnostics) => void;

class AcousticEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isPlaying = false;
  private isMicActive = false;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private listeners: Set<AudioStateListener> = new Set();

  /**
   * Lazily initializes and unlocks Web Audio AudioContext at 48,000 Hz.
   * AudioContext is strictly isolated here and NEVER stored in React state.
   */
  public async initContext(): Promise<AudioContext | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      if (!this.audioCtx) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

        if (!AudioContextClass) {
          logger.error('AUDIO', 'Web Audio API is not supported in this browser environment');
          return null;
        }

        this.audioCtx = new AudioContextClass({
          sampleRate: APP_CONFIG.SAMPLE_RATE,
        });

        // Initialize Analyser for 60fps spectrum & waveform visualizer
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;

        this.audioCtx.onstatechange = () => {
          this.notifyState();
        };

        logger.info('AUDIO', 'Web Audio Context initialized', {
          sampleRate: `${this.audioCtx.sampleRate} Hz`,
          state: this.audioCtx.state,
          baseLatency: this.audioCtx.baseLatency
            ? `${(this.audioCtx.baseLatency * 1000).toFixed(1)} ms`
            : 'N/A',
        });
      }

      // Resume context if suspended (browser autoplay policy)
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
        logger.info('AUDIO', 'Web Audio Context resumed from suspended state', {
          state: this.audioCtx.state,
        });
      }

      this.notifyState();
      return this.audioCtx;
    } catch (err) {
      logger.error('AUDIO', `AudioContext initialization failed: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Acquires the raw device microphone stream without browser noise suppression or echo cancellation.
   * Connects microphone strictly to AnalyserNode (NEVER to destination) to prevent feedback howling.
   */
  public async startMicrophone(): Promise<void> {
    if (this.isMicActive) return;

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      const err = new Error('Microphone mediaDevices API not available in this browser');
      logger.error('AUDIO', err.message);
      throw err;
    }

    try {
      const ctx = await this.initContext();
      if (!ctx || !this.analyser) {
        throw new Error('AudioContext or AnalyserNode unavailable');
      }

      // Request raw, unadulterated microphone audio stream
      this.micStream = await navigator.mediaDevices.getUserMedia(RAW_AUDIO_CONSTRAINTS);
      this.micSource = ctx.createMediaStreamSource(this.micStream);

      // Connect mic ONLY to analyser (isolated DSP graph, zero speaker output)
      this.micSource.connect(this.analyser);
      this.isMicActive = true;

      const track = this.micStream.getAudioTracks()[0];
      const settings = track?.getSettings() || {};

      logger.success('AUDIO', 'Raw microphone stream locked (zero filtering)', {
        sampleRate: `${settings.sampleRate || ctx.sampleRate} Hz`,
        channelCount: settings.channelCount || 1,
        echoCancellation: settings.echoCancellation ?? false,
        noiseSuppression: settings.noiseSuppression ?? false,
        autoGainControl: settings.autoGainControl ?? false,
      });

      this.notifyState();
    } catch (err) {
      this.isMicActive = false;
      const msg = (err as Error).message || 'Microphone permission denied';
      logger.error('AUDIO', `Microphone capture failed: ${msg}`);
      this.notifyState();
      throw err;
    }
  }

  /**
   * Gracefully releases microphone media stream tracks and disconnects nodes.
   */
  public stopMicrophone(): void {
    if (!this.isMicActive && !this.micStream && !this.micSource) return;

    try {
      if (this.micSource) {
        this.micSource.disconnect();
        this.micSource = null;
      }

      if (this.micStream) {
        this.micStream.getTracks().forEach((track) => track.stop());
        this.micStream = null;
      }

      this.isMicActive = false;
      logger.info('AUDIO', 'Microphone stream stopped');
      this.notifyState();
    } catch (err) {
      logger.error('AUDIO', `Error releasing microphone: ${(err as Error).message}`);
    }
  }

  /**
   * Copies current FFT frequency data into target buffer.
   * Called directly by 60fps Canvas render loops without React state thrashing.
   */
  public getFrequencyData(targetBuffer: Uint8Array): boolean {
    if (!this.analyser) return false;
    this.analyser.getByteFrequencyData(targetBuffer as unknown as Uint8Array<ArrayBuffer>);
    return true;
  }

  /**
   * Copies current time-domain waveform data into target buffer.
   */
  public getTimeDomainData(targetBuffer: Uint8Array): boolean {
    if (!this.analyser) return false;
    this.analyser.getByteTimeDomainData(targetBuffer as unknown as Uint8Array<ArrayBuffer>);
    return true;
  }

  /**
   * Computes the dominant frequency bin in Hz and current signal intensity in dB.
   */
  public getPeakFrequencyHz(): { freqHz: number; decibels: number } {
    if (!this.analyser || !this.audioCtx) {
      return { freqHz: 0, decibels: -100 };
    }

    const binCount = this.analyser.frequencyBinCount;
    const buffer = new Uint8Array(binCount);
    this.analyser.getByteFrequencyData(buffer);

    let maxVal = 0;
    let maxIdx = 0;

    for (let i = 0; i < binCount; i++) {
      if (buffer[i] > maxVal) {
        maxVal = buffer[i];
        maxIdx = i;
      }
    }

    // Ignore ambient room floor noise
    if (maxVal < 18) {
      return { freqHz: 0, decibels: -100 };
    }

    const sampleRate = this.audioCtx.sampleRate;
    const fftSize = this.analyser.fftSize;
    const freqHz = Math.round((maxIdx * sampleRate) / fftSize);
    const decibels = Math.round((maxVal / 255) * 100 - 100);

    return { freqHz, decibels };
  }

  /**
   * Emits a calibrated acoustic tone through the hardware speaker.
   * - AUDIBLE_FAST: Dual-step FSK telemetry chime (1875 Hz -> 3125 Hz).
   * - ULTRASONIC_STEALTH: 18.5 kHz near-ultrasound carrier burst.
   */
  public async playCalibrationTone(
    protocol: AudioProtocol,
    durationMs = 600
  ): Promise<void> {
    const ctx = await this.initContext();
    if (!ctx) {
      throw new Error('AudioContext unavailable');
    }

    return new Promise<void>((resolve, reject) => {
      try {
        this.isPlaying = true;
        this.notifyState();

        const durationSec = durationMs / 1000;
        const now = ctx.currentTime;
        const attack = 0.03;
        const release = 0.04;
        const peakGain = 0.15; // Gentle, non-distorting volume

        // Create Oscillator and Gain nodes
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Smooth envelope ramp to eliminate audio clicking/popping
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(peakGain, now + attack);
        gain.gain.setValueAtTime(peakGain, now + durationSec - release);
        gain.gain.linearRampToValueAtTime(0.0001, now + durationSec);

        // Configure frequency modulation based on protocol
        if (protocol === 'AUDIBLE_FAST') {
          // Dual-step FSK telemetry chime: 1875 Hz -> 3125 Hz
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1875, now);
          osc.frequency.setValueAtTime(3125, now + durationSec / 2);

          logger.info('AUDIO', 'Emitting audible calibration chime (1875Hz -> 3125Hz)', {
            duration: `${durationMs} ms`,
            hardwareRate: `${ctx.sampleRate} Hz`,
            protocol,
          });
        } else {
          // Ultrasonic stealth carrier: 18,500 Hz
          osc.type = 'sine';
          osc.frequency.setValueAtTime(18500, now);

          logger.warn(
            'AUDIO',
            'Broadcasting 18.5kHz ultrasonic carrier (inaudible to human ears)',
            {
              frequency: '18,500 Hz',
              duration: `${durationMs} ms`,
              hardwareRate: `${ctx.sampleRate} Hz`,
              protocol,
            }
          );
        }

        // Connect graph: osc -> gain -> analyser -> destination
        osc.connect(gain);
        if (this.analyser) {
          gain.connect(this.analyser);
          this.analyser.connect(ctx.destination);
        } else {
          gain.connect(ctx.destination);
        }

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch {
            // Already disconnected
          }
          this.isPlaying = false;
          this.notifyState();
          resolve();
        };

        osc.start(now);
        osc.stop(now + durationSec);
      } catch (err) {
        this.isPlaying = false;
        this.notifyState();
        logger.error('AUDIO', `Tone playback failed: ${(err as Error).message}`);
        reject(err);
      }
    });
  }

  /**
   * Returns current hardware audio diagnostic metrics.
   */
  public getDiagnostics(): AudioDiagnostics {
    if (!this.audioCtx) {
      return {
        state: 'UNINITIALIZED',
        sampleRate: null,
        baseLatency: null,
        isMicActive: this.isMicActive,
        isPlaying: this.isPlaying,
      };
    }

    return {
      state: this.audioCtx.state,
      sampleRate: this.audioCtx.sampleRate,
      baseLatency: this.audioCtx.baseLatency ?? null,
      isMicActive: this.isMicActive,
      isPlaying: this.isPlaying,
    };
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getIsMicActive(): boolean {
    return this.isMicActive;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public subscribe(listener: AudioStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getDiagnostics());

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyState(): void {
    const diag = this.getDiagnostics();
    for (const listener of this.listeners) {
      try {
        listener(diag);
      } catch (err) {
        console.error('Error in audio state listener:', err);
      }
    }
  }
}

export const acousticEngine = new AcousticEngine();
export { AcousticEngine };
