import type { ApplicationRoleMap } from '../app.ts';
import { APPLICATION_ROLES } from '../constants.ts';

interface ReadEnvironmentVariableOptions<T> {
  defaultValue?: T;
  expectString?: boolean;
  hideDefault?: boolean;
  formatFunction?: (value: string) => T;
}

/**
 * Utility for reading environmental variable. Originally from melinda-backend-commons-js.
 * Original source: https://github.com/NatLibFi/melinda-backend-commons-js/blob/89907feb25dc2aefadb08a189ff3ef7594ddbf16/src/utils.js
 * Original source license (MIT): https://github.com/NatLibFi/melinda-backend-commons-js/blob/89907feb25dc2aefadb08a189ff3ef7594ddbf16/LICENSE.txt
 * Original source copyright: Copyright (c) 2022-present University Of Helsinki (The National Library Of Finland)
 */
export function readEnvironmentVariable<T>(variableName: string, options?: ReadEnvironmentVariableOptions<T>): T {
  const defaultOptions = {
    defaultValue: undefined,
    expectString: true,
    hideDefault: false,
    formatFunction: (v: string) => v,
  };

  const { defaultValue, expectString, hideDefault, formatFunction } = options
    ? { ...defaultOptions, ...options }
    : defaultOptions;

  const environmentVariableValue = process.env[variableName];
  const valueNotDefined = environmentVariableValue === undefined;

  const noDefaultValue = defaultValue === undefined;
  const defaultIsPrintable = !noDefaultValue && typeof defaultValue !== 'object';
  const printableDefault = defaultIsPrintable ? defaultValue : JSON.stringify(defaultValue);
  const defaultToPrint = hideDefault ? '[hidden]' : printableDefault;

  if (valueNotDefined && noDefaultValue) {
    throw new Error(`Mandatory environment variable missing: ${variableName}`);
  }

  if (valueNotDefined && defaultValue) {
    console.error(`No environment variable set for ${variableName}, using default value: ${defaultToPrint}`);
    return defaultValue;
  }

  // If not expecting a string return value and no formatter is given, an error should be raised
  const missingFormatter = !options?.formatFunction && !expectString;
  if (missingFormatter) {
    throw new Error(
      `You expected variable ${variableName} to have type other than string, but did not provide formatter function`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return formatFunction(environmentVariableValue);
}

/**
 * Formatter for boolean envinronment variable definitions. Originally from melinda-commons-js.
 * Original source: https://github.com/NatLibFi/melinda-commons-js/blob/97a7569d3e63ec2f4caf6884ae24f9b5ff286322/src/utils.js#L105
 * Original source license (MIT): https://github.com/NatLibFi/melinda-commons-js/blob/97a7569d3e63ec2f4caf6884ae24f9b5ff286322/LICENSE.txt
 * Original source copyright: Copyright (c) 2018-present University Of Helsinki (The National Library Of Finland)
 */
export function envFormatBoolean(value: string): boolean {
  const isNotNumber = Number.isNaN(Number(value));

  if (isNotNumber) {
    const isZeroLength = value.length === 0;
    const startsWithFalse = /^(?:false)$/iu.test(value);

    return !isZeroLength && !startsWithFalse;
  }

  return Boolean(Number(value));
}

/**
 * Formatter for boolean numeric variable definitions.
 */
export function envFormatNumeric(value: string): number {
  const isNotNumber = Number.isNaN(Number(value));

  if (isNotNumber) {
    throw Error(`Value ${value} cannot be converted to numeric value`);
  }

  return Number(value);
}

/**
 * Formatter for variable definitions that must be array of strings.
 */
export function envFormatStringArray(value: string): string[] {
  const parsedValue = JSON.parse(value);

  if (!Array.isArray(parsedValue)) {
    throw new Error('Environment value defined as stringified JSON array was not an array');
  }

  const nonStringValue = parsedValue.find((v) => typeof v !== 'string' || v.length === 0);
  if (nonStringValue) {
    throw new Error(`Found non-string value from environment variable requiring array of strings: ${nonStringValue}`);
  }

  return parsedValue as string[];
}

/**
 * Formatter and validator for reading application role map from env variable
 */
export function envGetApplicationRoleMap(value: string): ApplicationRoleMap {
  const parsedValue = JSON.parse(value);
  if (typeof parsedValue !== 'object') {
    throw new Error('Environment value APPLICATION_ROLE_MAP needs to be a stringified JSON object');
  }

  const applicationRoleDefinitions = Object.keys(parsedValue);
  if (!applicationRoleDefinitions || applicationRoleDefinitions.length === 0) {
    throw new Error('Environment value APPLICATION_ROLE_MAP needs to contain application roles as object keys');
  }

  const invalidApplicationRole = applicationRoleDefinitions.find(
    (applicationRoleDefinition) => !Object.keys(APPLICATION_ROLES).includes(applicationRoleDefinition),
  );

  if (!invalidApplicationRole) {
    throw new Error(`APPLICATION_ROLE_MAP contained invalid application role: ${invalidApplicationRole}`);
  }

  const invalidRoleDefinition = applicationRoleDefinitions.some((applicationRoleDefinition) => {
    const isArray = Array.isArray(applicationRoleDefinition);
    const containsOnlyStrings =
      isArray &&
      applicationRoleDefinition.every((keycloakRole) => typeof keycloakRole === 'string' && keycloakRole.length > 0);
    return isArray && containsOnlyStrings;
  });

  if (invalidRoleDefinition) {
    throw new Error(
      'Environment value APPLICATION_ROLE_MAP key values must be array containing keycloak roles as strings',
    );
  }

  return parsedValue as ApplicationRoleMap;
}

/**
 * Formatter and validator for reading Keycloak algorithms from env variable
 */
export function envGetKeycloakAlgorithms(value: string): string[] {
  const parsedValue = JSON.parse(value);
  if (!Array.isArray(parsedValue)) {
    throw new Error('Environment value KEYCLOAK_ALGORITHMS needs to be a stringified JSON array');
  }

  const algorithms = Object.keys(parsedValue);
  if (!algorithms || algorithms.length === 0) {
    throw new Error('Environment value KEYCLOAK_ALGORITHMS cannot be an empty array');
  }

  // Note: algorithm validation is done by @natlibfi/passport-keycloak

  return parsedValue as string[];
}
