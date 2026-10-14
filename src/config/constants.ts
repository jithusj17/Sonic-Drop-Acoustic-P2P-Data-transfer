export const APP_CONFIG = {
  APP_NAME: 'SonicDrop',
  APP_VERSION: '0.1.0',
  SAMPLE_RATE: 48000,
  MAX_ACOUSTIC_BYTES: 140,
  RELAY_TTL_SECONDS: 300,
  TOKEN_LENGTH: 4,
} as const;

export type AppConfig = typeof APP_CONFIG;
