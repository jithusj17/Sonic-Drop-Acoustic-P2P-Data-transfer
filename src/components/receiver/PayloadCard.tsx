'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  Download,
  FileText,
  File,
  Lock,
} from 'lucide-react';
import { ReceivedItem } from '@/types';
import { logger } from '@/lib/logger';

interface PayloadCardProps {
  item: ReceivedItem;
}

export function PayloadCard({ item }: PayloadCardProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isUrl = /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(item.content.trim());

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      logger.info('SYSTEM', 'Copied received payload to clipboard', {
        id: item.id,
      });
    } catch {
      console.warn('Clipboard write failed');
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    logger.info('API', `Initiating mock cloud relay download: "${item.content}"`, {
      id: item.id,
      fileSize: item.fileSize,
    });

    // Simulate download delay
    setTimeout(() => {
      setDownloading(false);
      logger.success('API', `Simulated file download complete: "${item.content}"`);
    }, 1200);
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-700 space-y-3">
      {/* Meta Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          {item.type === 'TEXT' ? (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide px-1.5 py-0.5 border border-emerald-800 text-emerald-400 bg-zinc-950">
              <FileText className="w-3 h-3" />
              DIRECT TEXT
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wide px-1.5 py-0.5 border border-amber-800 text-amber-400 bg-zinc-950">
              <Lock className="w-3 h-3" />
              ENCRYPTED RELAY
            </span>
          )}

          <span className="text-[10px] font-mono text-zinc-500 uppercase">
            {item.protocol === 'AUDIBLE_FAST' ? 'AUDIBLE' : 'ULTRASOUND'}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-500">
          <span>{item.byteLength} B OVER AIR</span>
          <span>•</span>
          <span>{item.timestamp}</span>
        </div>
      </div>

      {/* Content Display */}
      <div>
        {item.type === 'FILE_RELAY' ? (
          <div className="border border-zinc-800 bg-zinc-950 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <File className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-mono text-zinc-100 font-medium truncate">
                  {item.content}
                </p>
                <p className="text-[10px] font-mono text-zinc-500">
                  Size: {formatFileSize(item.fileSize)} // Ephemeral Handshake Verified
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-200 break-words whitespace-pre-wrap select-all">
            {item.content}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {item.type === 'TEXT' && (
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono border border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy Text</span>
              </>
            )}
          </button>
        )}

        {isUrl && (
          <a
            href={item.content}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono border border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900 text-emerald-400 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open URL</span>
          </a>
        )}

        {item.type === 'FILE_RELAY' && (
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono border border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900 text-amber-400 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Downloading...' : 'Download File'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
