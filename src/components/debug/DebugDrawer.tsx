'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Terminal,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import { logger } from '@/lib/logger';
import { LogCategory, LogEntry, LogLevel } from '@/types';

type FilterOption = 'ALL' | LogCategory;

const FILTER_TABS: FilterOption[] = [
  'ALL',
  'SYSTEM',
  'PROTOCOL',
  'AUDIO',
  'CRYPTO',
  'API',
];

export function DebugDrawer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<FilterOption>('ALL');
  const [copied, setCopied] = useState<boolean>(false);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = logger.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return () => unsubscribe();
  }, []);

  const filteredLogs = useMemo(() => {
    if (activeFilter === 'ALL') {
      return logs;
    }
    return logs.filter((log) => log.category === activeFilter);
  }, [logs, activeFilter]);

  // Auto-scroll when new logs arrive if expanded
  useEffect(() => {
    if (isExpanded && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, isExpanded]);

  const handleCopy = async () => {
    if (filteredLogs.length === 0) return;

    const formatted = filteredLogs
      .map((log) => {
        const time = new Date(log.timestamp).toISOString();
        const dataStr = log.data ? ` | DATA: ${JSON.stringify(log.data)}` : '';
        return `[${time}] [${log.level}] [${log.category}] ${log.message}${dataStr}`;
      })
      .join('\n');

    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API unavailable
      console.warn('Clipboard write failed');
    }
  };

  const handleClear = () => {
    logger.clear();
  };

  const formatTime = (ts: number): string => {
    const d = new Date(ts);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
  };

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'SUCCESS':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wide px-1.5 py-0.5 border border-emerald-800 text-emerald-400 bg-zinc-900 select-none">
            OK
          </span>
        );
      case 'WARN':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wide px-1.5 py-0.5 border border-amber-800 text-amber-400 bg-zinc-900 select-none">
            WARN
          </span>
        );
      case 'ERROR':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wide px-1.5 py-0.5 border border-rose-800 text-rose-400 bg-zinc-900 select-none">
            ERR
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="font-mono text-[10px] uppercase tracking-wide px-1.5 py-0.5 border border-zinc-800 text-zinc-400 bg-zinc-900 select-none">
            INFO
          </span>
        );
    }
  };

  return (
    <aside
      aria-label="Developer Console"
      className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800 text-zinc-100 select-none"
    >
      {/* Drawer Control Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 border-b border-zinc-800/80 gap-2 bg-zinc-950">
        {/* Toggle & Title */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center gap-2 px-2.5 py-1 text-xs font-mono font-medium border border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-200 transition-colors cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            <span className="tracking-wider">CONSOLE</span>
            <span className="text-[10px] px-1 py-0.2 text-zinc-400 bg-zinc-800 border border-zinc-700 font-mono">
              {logs.length}
            </span>
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </button>

          <span className="hidden sm:inline-block text-[11px] font-mono text-zinc-500">
            // DEBUG STREAM
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={`px-2 py-0.5 text-[11px] font-mono transition-colors border cursor-pointer ${
                  isActive
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-100 font-medium'
                    : 'bg-zinc-950 border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-800'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={handleCopy}
            disabled={filteredLogs.length === 0}
            title="Copy logs to clipboard"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono border border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">COPIED</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-zinc-400" />
                <span>COPY</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={logs.length === 0}
            title="Clear all logs"
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono border border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-300 hover:text-rose-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3 text-zinc-400" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      {isExpanded && (
        <div
          ref={logsContainerRef}
          className="h-64 overflow-y-auto bg-zinc-950 select-text p-2 space-y-1 divide-y divide-zinc-900/60 font-mono text-xs"
        >
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-600 font-mono text-xs space-y-1 py-8">
              <span className="tracking-widest">// NO LOG ENTRIES RECORDED</span>
              <span className="text-[11px] text-zinc-700">
                Trigger diagnostic actions above or wait for system events
              </span>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="pt-1.5 first:pt-0 pb-1 flex flex-col gap-1 hover:bg-zinc-900/40 px-2 transition-colors border-l-2 border-transparent hover:border-zinc-700"
              >
                <div className="flex flex-wrap items-center gap-2 leading-tight">
                  <span className="text-zinc-500 font-mono text-[11px] shrink-0 select-none">
                    {formatTime(log.timestamp)}
                  </span>
                  {getLevelBadge(log.level)}
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 border border-zinc-800 bg-zinc-900 px-1 py-0.5 select-none">
                    {log.category}
                  </span>
                  <span className="text-zinc-200 font-mono text-xs break-all flex-1">
                    {log.message}
                  </span>
                </div>

                {log.data !== undefined && (
                  <pre className="mt-1 text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-800 p-2 overflow-x-auto whitespace-pre-wrap rounded-none">
                    {typeof log.data === 'string'
                      ? log.data
                      : JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </aside>
  );
}
