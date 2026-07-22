import { ENV } from '../constants.ts';

export function isProduction() {
  return process.env['NODE_ENV']?.toUpperCase() === ENV.PRODUCTION;
}

export function isStaging() {
  return process.env['NODE_ENV']?.toUpperCase() === ENV.STAGING;
}

export function isDevelopment() {
  return process.env['NODE_ENV']?.toUpperCase() === ENV.DEVELOPMENT;
}

export function isAutomatedTest() {
  return process.env['NODE_ENV']?.toUpperCase() === ENV.TEST;
}

export function generateRangeArray(length: number) {
  return [...Array(length).keys()];
}
