import { APP_CONFIG } from '@/config/constants';
import { logger } from '@/lib/logger';
import { DecodedPacket, PayloadAnalysis } from '@/types';

const textEncoder = new TextEncoder();

/**
 * Returns exact UTF-8 byte length of a string.
 * Accurately measures multi-byte Unicode characters (emojis, non-Latin scripts, etc.).
 */
export function getUtf8ByteLength(str: string): number {
  if (!str) return 0;
  return textEncoder.encode(str).length;
}

/**
 * Evaluates a text payload against acoustic bandwidth constraints
 * and determines optimal transmission strategy.
 */
export function analyzePayload(text: string, hasFile = false): PayloadAnalysis {
  const byteLength = getUtf8ByteLength(text);
  const maxBytes = APP_CONFIG.MAX_ACOUSTIC_BYTES;
  const isWithinAcousticLimit = byteLength <= maxBytes && !hasFile;
  const recommendedMode = isWithinAcousticLimit ? 'PURE_ACOUSTIC' : 'CLOUD_RELAY';
  const utilizationPercent = Math.min(
    100,
    Math.round((byteLength / maxBytes) * 100)
  );

  return {
    byteLength,
    maxBytes,
    recommendedMode,
    isWithinAcousticLimit,
    utilizationPercent,
  };
}

/**
 * Encodes a text message into an acoustic direct payload frame ('T:<payload>').
 * Validates that total UTF-8 bytes do not exceed the acoustic limit.
 */
export function encodeTextPacket(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    const errorMsg = 'Encoding failed: Text payload cannot be empty';
    logger.error('PROTOCOL', errorMsg);
    throw new Error(errorMsg);
  }

  const packet = `T:${trimmed}`;
  const byteLength = getUtf8ByteLength(packet);

  if (byteLength > APP_CONFIG.MAX_ACOUSTIC_BYTES) {
    const overflow = byteLength - APP_CONFIG.MAX_ACOUSTIC_BYTES;
    const errorMsg = `Encoding failed: Packet size (${byteLength} B) exceeds maximum acoustic frame cap (${APP_CONFIG.MAX_ACOUSTIC_BYTES} B) by ${overflow} B`;
    logger.error('PROTOCOL', errorMsg, {
      byteLength,
      maxBytes: APP_CONFIG.MAX_ACOUSTIC_BYTES,
      overflowBytes: overflow,
    });
    throw new Error(errorMsg);
  }

  logger.info('PROTOCOL', 'Encoded direct text packet', {
    byteLength,
    packetLength: packet.length,
    payloadPreview: trimmed.slice(0, 32),
  });

  return packet;
}

/**
 * Encodes a 4-character token and encryption metadata into a file relay handshake packet ('F:<token>:<keyIv>').
 */
export function encodeFileRelayPacket(token: string, keyIv: string): string {
  const cleanToken = token.trim().toUpperCase();
  const cleanKeyIv = keyIv.trim();

  const tokenRegex = new RegExp(`^[A-Z0-9]{${APP_CONFIG.TOKEN_LENGTH}}$`, 'i');
  if (!tokenRegex.test(cleanToken)) {
    const errorMsg = `Invalid relay token "${token}". Token must be exactly ${APP_CONFIG.TOKEN_LENGTH} alphanumeric characters.`;
    logger.error('PROTOCOL', `File relay encoding failed: ${errorMsg}`, { token });
    throw new Error(errorMsg);
  }

  if (!cleanKeyIv) {
    const errorMsg = 'File relay encoding failed: Encryption key & IV cannot be empty.';
    logger.error('PROTOCOL', errorMsg);
    throw new Error(errorMsg);
  }

  const packet = `F:${cleanToken}:${cleanKeyIv}`;
  const byteLength = getUtf8ByteLength(packet);

  logger.info('PROTOCOL', 'Encoded file relay handshake packet', {
    token: cleanToken,
    keyIvLength: cleanKeyIv.length,
    byteLength,
  });

  return packet;
}

/**
 * Decodes and validates an incoming raw acoustic frame.
 * Dispatches to either text direct payload ('T:') or cloud relay handshake ('F:').
 */
export function decodePacket(rawFrame: string): DecodedPacket {
  if (!rawFrame || typeof rawFrame !== 'string') {
    const errorMsg = 'Decoding failed: Empty or invalid acoustic frame string';
    logger.error('PROTOCOL', errorMsg, { rawFrame });
    throw new Error(errorMsg);
  }

  const frame = rawFrame.trim();
  const byteLength = getUtf8ByteLength(frame);

  if (frame.startsWith('T:')) {
    const payload = frame.slice(2);
    logger.success('PROTOCOL', 'Decoded direct text packet', {
      byteLength,
      payloadLength: payload.length,
      preview: payload.slice(0, 32),
    });

    return {
      type: 'TEXT',
      payload,
      byteLength,
      raw: frame,
    };
  }

  if (frame.startsWith('F:')) {
    // Format: F:<token>:<keyIv>
    const parts = frame.split(':');
    const token = parts[1];
    const keyIv = parts.slice(2).join(':');

    if (!token || !keyIv) {
      const errorMsg = `Malformed file relay frame: "${frame}". Expected format "F:<token>:<keyIv>"`;
      logger.error('PROTOCOL', 'Decoding failed: Malformed file relay frame', {
        rawFrame: frame,
      });
      throw new Error(errorMsg);
    }

    logger.success('PROTOCOL', 'Decoded file relay handshake packet', {
      token,
      keyIvPreview: keyIv.slice(0, 16),
      byteLength,
    });

    return {
      type: 'FILE_RELAY',
      token,
      keyIv,
      byteLength,
      raw: frame,
    };
  }

  const errorMsg = `Malformed or unrecognized acoustic frame: "${frame}". Expected "T:" or "F:" prefix.`;
  logger.error('PROTOCOL', 'Malformed or unrecognized acoustic frame', { rawFrame: frame });
  throw new Error(errorMsg);
}
