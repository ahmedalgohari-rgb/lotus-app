/**
 * Production-ready logger utility
 * Conditionally logs based on environment and provides structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment = __DEV__;

  /**
   * Log debug messages (only in development)
   */
  debug(message: string, data?: any) {
    if (this.isDevelopment) {
      this.log('debug', message, data);
    }
  }

  /**
   * Log info messages
   */
  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  /**
   * Log warning messages
   */
  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  /**
   * Log error messages (always logged)
   */
  error(message: string, error?: any) {
    this.log('error', message, error);
    
    // In production, send to error monitoring service
    if (!this.isDevelopment && error) {
      // TODO: Send to Sentry or other monitoring service
      // Sentry.captureException(error instanceof Error ? error : new Error(message));
    }
  }

  private log(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    // Use appropriate console method
    const consoleMethod = console[level] || console.log;
    
    if (data) {
      consoleMethod(`[${level.toUpperCase()}] ${message}`, data);
    } else {
      consoleMethod(`[${level.toUpperCase()}] ${message}`);
    }
  }
}

export const logger = new Logger();
export default logger;