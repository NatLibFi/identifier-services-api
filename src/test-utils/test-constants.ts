import { DateTime } from 'luxon';

export const TEST_USER_1 = 'TEST_USER_1';
export const TEST_USER_2 = 'TEST_USER_2';

export const TEST_CREATION_DATE_ISO = '2025-01-20T12:00:00.000';
export const TEST_CREATION_DATE = DateTime.fromISO(TEST_CREATION_DATE_ISO, { zone: 'UTC' });

export const TEST_MODIFICATION_DATE_ISO = '2026-01-20T12:00:00.000';
export const TEST_MODIFICATION_DATE = DateTime.fromISO(TEST_MODIFICATION_DATE_ISO, { zone: 'UTC' });
