import * as fs from 'fs';
import * as path from 'path';

const logsDir = path.join(process.cwd(), 'logs');
let isInitialized = false;

function initialize(): void {
    if (!isInitialized) {
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        isInitialized = true;
    }
}

function getLogFileName(type: 'combined' | 'error'): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(logsDir, `${type}-${date}.log`);
}

function writeToFile(level: string, message: string, meta?: any): void {
    initialize();

    const logMessage = formatMessage(level, message, meta);
    const logLine = `${logMessage}\n`;

    fs.appendFileSync(getLogFileName('combined'), logLine);

    if (level === 'ERROR') {
        fs.appendFileSync(getLogFileName('error'), logLine);
    }
}

function formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
}

export const Logger = {
    info(message: string, meta?: any): void {
        const formatted = formatMessage('INFO', message, meta);
        console.log(formatted);
        writeToFile('INFO', message, meta);
    },
    error(message: string, meta?: any): void {
        const formatted = formatMessage('ERROR', message, meta);
        console.error(formatted);
        writeToFile('ERROR', message, meta);
    },
    warn(message: string, meta?: any): void {
        const formatted = formatMessage('WARN', message, meta);
        console.warn(formatted);
        writeToFile('WARN', message, meta);
    },
    debug(message: string, meta?: any): void {
        if (process.env.NODE_ENV === 'development') {
            const formatted = formatMessage('DEBUG', message, meta);
            console.debug(formatted);
            writeToFile('DEBUG', message, meta);
        }
    },
};
