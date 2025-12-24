export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

const defaultLevel: LogLevel = import.meta.env.DEV ? 'debug' : 'warn';

const shouldLog = (level: LogLevel, minLevel: LogLevel) => {
  return levelOrder[level] >= levelOrder[minLevel];
};

const asError = (value: unknown): Error | undefined => {
  if (value instanceof Error) return value;
  if (typeof value === 'object' && value && 'message' in value) {
    try {
      return new Error(String((value as any).message));
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const write = (level: Exclude<LogLevel, 'silent'>, args: unknown[]) => {
  if (!shouldLog(level, defaultLevel)) return;

  // eslint-disable-next-line no-console
  const fn = console[level] ?? console.log;

  const error = args.length === 1 ? asError(args[0]) : undefined;
  if (error) {
    // eslint-disable-next-line no-console
    fn.call(console, error);
    return;
  }

  // eslint-disable-next-line no-console
  fn.apply(console, args as any);
};

export const logger = {
  debug: (...args: unknown[]) => write('debug', args),
  info: (...args: unknown[]) => write('info', args),
  warn: (...args: unknown[]) => write('warn', args),
  error: (...args: unknown[]) => write('error', args),
};
