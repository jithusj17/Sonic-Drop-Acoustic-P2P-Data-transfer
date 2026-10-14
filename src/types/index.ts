export type TransferMode = 'PURE_ACOUSTIC' | 'CLOUD_RELAY';

export type AudioProtocol = 'AUDIBLE_FAST' | 'ULTRASONIC_STEALTH';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';

export type LogCategory = 'SYSTEM' | 'PROTOCOL' | 'AUDIO' | 'CRYPTO' | 'API';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: unknown;
}

export type LogListener = (logs: LogEntry[]) => void;
