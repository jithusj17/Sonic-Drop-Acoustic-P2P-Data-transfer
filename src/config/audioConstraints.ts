import { APP_CONFIG } from './constants';

/**
 * Raw audio constraints configured for acoustic data transmission.
 * Browser echo cancellation, noise suppression, and auto-gain control
 * are strictly disabled to prevent DSP algorithms from filtering out
 * acoustic carrier frequencies (both audible FSK and near-ultrasonic).
 */
export const RAW_AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    channelCount: 1,
    sampleRate: APP_CONFIG.SAMPLE_RATE,
  },
  video: false,
};
