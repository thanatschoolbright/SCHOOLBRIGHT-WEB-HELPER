type LogType = 'log' | 'info' | 'warn' | 'error';

const logSymbols: Record<LogType, string> = {
    log: '✅',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
};

const logColors: Record<LogType, string> = {
    log: '\x1b[32m', // green
    info: '\x1b[36m', // cyan
    warn: '\x1b[33m', // yellow
    error: '\x1b[31m', // red
};

const resetColor = '\x1b[0m';

const MAX_LENGTH = 1000;

function truncateIfLong(input: unknown): string {
    try {
        const str =
            typeof input === 'object' && input !== null
                ? JSON.stringify(input, null, 2)
                : String(input);

        return str.length > MAX_LENGTH
            ? str.slice(0, MAX_LENGTH) + ' ...see more'
            : str;
    } catch {
        return '[ERROR: failed to stringify]';
    }
}

function baseBeautifulLog(
    data: unknown,
    type: LogType = 'log',
    space: number = 2
): void {
    const logFn = console[type] ?? console.log;
    const emoji = logSymbols[type];
    const color = logColors[type];

    try {
        const formatted = truncateIfLong(data);
        logFn(`${color}${emoji} [${type.toUpperCase()}]${resetColor}`);
        logFn(formatted);
        logFn(`${color}${'='.repeat(40)}${resetColor}`);
    } catch (error) {
        console.error(`${logColors.error}❌ [ERROR] Failed to stringify log:${resetColor}`, error);
        logFn(data);
    }
}

// Extend with static methods
baseBeautifulLog.log = (data: unknown, space = 2) => baseBeautifulLog(data, 'log', space);
baseBeautifulLog.info = (data: unknown, space = 2) => baseBeautifulLog(data, 'info', space);
baseBeautifulLog.warn = (data: unknown, space = 2) => baseBeautifulLog(data, 'warn', space);
baseBeautifulLog.error = (data: unknown, space = 2) => baseBeautifulLog(data, 'error', space);

// Export
export const apiLog = baseBeautifulLog;
export default apiLog;