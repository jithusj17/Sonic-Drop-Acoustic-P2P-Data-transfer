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

/* =========================================================================
   Packet Protocol Types (Step 2)
   ========================================================================= */

export type PacketType = 'TEXT' | 'FILE_RELAY';

export type DecodedPacket =
  | {
      type: 'TEXT';
      payload: string;
      byteLength: number;
      raw: string;
    }
  | {
      type: 'FILE_RELAY';
      token: string;
      keyIv: string;
      byteLength: number;
      raw: string;
    };

export interface PayloadAnalysis {
  byteLength: number;
  maxBytes: number;
  recommendedMode: TransferMode;
  isWithinAcousticLimit: boolean;
  utilizationPercent: number;
}

/* =========================================================================
   UI & Receiver Feed Types (Step 3)
   ========================================================================= */

export interface ReceivedItem {
  id: string;
  timestamp: string;
  type: 'TEXT' | 'FILE_RELAY';
  content: string; // the text/URL or filename
  byteLength: number;
  protocol: AudioProtocol;
  fileUrl?: string;
  fileSize?: number;
}

export type TransmitterState =
  | 'IDLE'
  | 'ENCODING_AUDIO'
  | 'BROADCASTING'
  | 'COMPLETED';

export type ReceiverState = 'IDLE' | 'LISTENING' | 'SIGNAL_LOCKED';
