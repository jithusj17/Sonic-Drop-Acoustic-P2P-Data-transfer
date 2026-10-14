import { APP_CONFIG } from '@/config/constants';
import { logger } from '@/lib/logger';
import { AudioProtocol } from '@/types';

export interface AudioDiagnostics {
  state: AudioContextState | 'UNINITIALIZED';
  sampleRate: number | null;
  baseLatency: number | null;
}

type AudioStateListener = (diag: AudioDiagnostics) => void;

class AcousticEngine {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isPlaying = false;
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

        // Initialize Analyser for Step 5 spectrum analysis
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;

        this.audioCtx.onstatechange = () => {
          this.notifyState();
        };

        logger.info('AUDIO', 'Web Audio Context initialized', {
          sampleRate: `${this.audioCtx.sampleRate} Hz`,
          state: this.audioCtx.state,
          baseLatency: this.audioCtx.baseLatency ? `${(this.audioCtx.baseLatency * 1000).toFixed(1)} ms` : 'N/A',
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
          resolve();
        };

        osc.start(now);
        osc.stop(now + durationSec);
      } catch (err) {
        this.isPlaying = false;
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
      };
    }

    return {
      state: this.audioCtx.state,
      sampleRate: this.audioCtx.sampleRate,
      baseLatency: this.audioCtx.baseLatency ?? null,
    };
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
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
