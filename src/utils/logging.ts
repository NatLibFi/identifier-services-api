import expressWinston from 'express-winston';
import { DateTime } from 'luxon';
import winston from 'winston';

import type { Handler } from 'express';

// Loggers are singletons (see e.g., https://refactoring.guru/design-patterns/singleton)
let APPLICATION_LOGGER: winston.Logger | undefined;
let EXPRESS_LOGGER: Handler | undefined;

export function getExpressLogger() {
  if (!EXPRESS_LOGGER) {
    throw new Error('express logger has not been created');
  }

  return EXPRESS_LOGGER;
}

export function createExpressLogger(logLevel = 'info', enableProxy?: boolean, ipAddressHeader?: string) {
  const useCustomMessage = enableProxy && ipAddressHeader;

  const customMessage = useCustomMessage
    ? `{{req.headers["${ipAddressHeader}"]}} HTTP {{req.method}} {{req.path}} - {{res.statusCode}} {{res.responseTime}}ms`
    : undefined;

  const message = customMessage
    ? customMessage
    : '{{req.ip}} HTTP {{req.method}} {{req.path}} - {{res.statusCode}} {{res.responseTime}}ms';

  const loggerOptions: expressWinston.LoggerOptions = createLoggerOptions(logLevel);
  loggerOptions.meta = true;
  loggerOptions.msg = message;

  return expressWinston.logger(loggerOptions);
}

export function getApplicationLogger(): winston.Logger {
  // If logger does not exist, construct it
  if (!APPLICATION_LOGGER) {
    throw new Error('Application logger has not been initialized');
  }

  return APPLICATION_LOGGER;
}

export function createApplicationLogger(logLevel = 'info'): winston.Logger {
  const loggerOptions = createLoggerOptions(logLevel);
  APPLICATION_LOGGER = winston.createLogger(loggerOptions);
  return APPLICATION_LOGGER;
}

// Helper to use in automated tests
export function resetApplicationLogger() {
  APPLICATION_LOGGER = undefined;
}

/**
 * Create options for Winston logger
 */
function createLoggerOptions(logLevel: string) {
  const timestampFormat = winston.format((info) => ({
    ...info,
    timestamp: DateTime.now().toISO(),
  }));

  return {
    format: winston.format.combine(timestampFormat(), winston.format.printf(formatMessage)),
    transports: [
      new winston.transports.Console({
        level: logLevel,
        silent: logLevel === 'silent',
      }),
    ],
  };

  function formatMessage(info: winston.Logform.TransformableInfo): string {
    return `${info['timestamp']} - ${info.level}: ${info.message}`;
  }
}
