/**
 * Structured logging utility following Grafana standards
 * Outputs JSON-formatted logs for easy parsing by log aggregation systems
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  [key: string]: any
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  service: string
  environment: string
  context?: LogContext
  error?: {
    message: string
    stack?: string
    code?: string
  }
  performance?: {
    duration_ms: number
  }
  request?: {
    method?: string
    path?: string
    userId?: string
    userRole?: string
  }
}

class Logger {
  private service: string = 'swing-decoder-handicap-tracker'
  private environment: string = process.env.NODE_ENV || 'development'

  private formatLog(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    duration?: number
  ): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      environment: this.environment,
    }

    if (context && Object.keys(context).length > 0) {
      entry.context = context
    }

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      }
    }

    if (duration !== undefined) {
      entry.performance = {
        duration_ms: duration,
      }
    }

    return JSON.stringify(entry)
  }

  debug(message: string, context?: LogContext) {
    console.log(this.formatLog(LogLevel.DEBUG, message, context))
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatLog(LogLevel.INFO, message, context))
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatLog(LogLevel.WARN, message, context))
  }

  error(message: string, error?: Error, context?: LogContext) {
    console.error(this.formatLog(LogLevel.ERROR, message, context, error))
  }

  // API request logging helpers
  apiRequest(method: string, path: string, userId?: string, userRole?: string) {
    this.info('API request received', {
      request: { method, path, userId, userRole },
    })
  }

  apiResponse(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string
  ) {
    this.info('API request completed', {
      request: { method, path, userId },
      response: { statusCode },
      performance: { duration_ms: duration },
    })
  }

  apiError(
    method: string,
    path: string,
    error: Error,
    statusCode: number,
    userId?: string
  ) {
    this.error('API request failed', error, {
      request: { method, path, userId },
      response: { statusCode },
    })
  }

  // Authentication logging helpers
  authEvent(
    event: 'signin' | 'signout' | 'signup' | 'session_created' | 'session_expired',
    userId?: string,
    email?: string,
    provider?: string,
    context?: LogContext
  ) {
    this.info(`Authentication event: ${event}`, {
      auth: { event, userId, email, provider },
      ...context,
    })
  }

  authError(event: string, error: Error, email?: string, provider?: string) {
    this.error(`Authentication error: ${event}`, error, {
      auth: { event, email, provider },
    })
  }

  // Database operation logging
  dbQuery(operation: string, model: string, duration?: number, recordCount?: number) {
    this.debug('Database query executed', {
      database: { operation, model, recordCount },
      ...(duration !== undefined && { performance: { duration_ms: duration } }),
    })
  }

  dbError(operation: string, model: string, error: Error) {
    this.error('Database query failed', error, {
      database: { operation, model },
    })
  }

  // Performance measurement
  startTimer() {
    return Date.now()
  }

  endTimer(startTime: number): number {
    return Date.now() - startTime
  }
}

// Singleton instance
export const logger = new Logger()

// Helper for timing async operations
export async function withTiming<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = logger.startTimer()
  try {
    const result = await fn()
    const duration = logger.endTimer(start)
    return { result, duration }
  } catch (error) {
    const duration = logger.endTimer(start)
    throw error
  }
}
