import { LogCategory, LogEntry, LogLevel, LogListener } from '@/types';

class Logger {
  private static readonly MAX_ENTRIES = 100;
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private counter = 0;

  constructor() {
    // Initialized empty
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    // Call immediately with existing logs snapshot
    listener([...this.logs]);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  private notify(): void {
    const snapshot = [...this.logs];
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('Error in logger subscriber:', err);
      }
    }
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    this.counter += 1;
    return `log-${Date.now()}-${this.counter}`;
  }

  private addEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: unknown
  ): LogEntry {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
    };

    this.logs.push(entry);

    if (this.logs.length > Logger.MAX_ENTRIES) {
      this.logs.splice(0, this.logs.length - Logger.MAX_ENTRIES);
    }

    this.notify();
    return entry;
  }

  public info(category: LogCategory, message: string, data?: unknown): void {
    this.addEntry('INFO', category, message, data);
  }

  public warn(category: LogCategory, message: string, data?: unknown): void {
    this.addEntry('WARN', category, message, data);
  }

  public error(category: LogCategory, message: string, data?: unknown): void {
    this.addEntry('ERROR', category, message, data);
  }

  public success(category: LogCategory, message: string, data?: unknown): void {
    this.addEntry('SUCCESS', category, message, data);
  }

  public clear(): void {
    this.logs = [];
    this.notify();
  }
}

export const logger = new Logger();
export { Logger };
