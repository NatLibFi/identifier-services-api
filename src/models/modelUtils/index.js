/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * API service of Identifier Services system
 *
 * Copyright (C) 2023 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of identifier-services-api
 *
 * identifier-services-api program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * identifier-services-api is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 */

/* Based on original work by Petteri Kivimäki (Identifier Registry) */
/**
 * Function to reduce boilerplate code as data transformations from string to array
 * may contain different types of empty values, e.g., undefined, null or empty string
 * @param {*} value DB value from VARCHAR field
 * @returns Empty array or array constructed using split function with comma as delimiter
 */
export function previousStringDataToArray(value) {
  if (value === undefined || value === null || value === '') {
    return [];
  }

  return value.split(',');
}

export function arrayToString(value) {
  // There are some special cases we want to save as they are
  if (value === null) {
    return null;
  }

  if (value === '') {
    return '';
  }

  if (!Array.isArray(value)) {
    throw new Error(`Unable to convert value ${value} to delimited string`);
  }

  if (value.length === 0) {
    return null;
  }

  return value.join(',');
}

/**
 * Transforms object to stringified JSON. Used by issn-registry models virtual setters.
 *  - FROM: {"title": ["Foo Series"], "issn": ["1797-0024"], "lastIssue": ["1/1990"]}
    - TO: '{"title":["Foo Series"],"issn":["1797-0024"],"last_issue":["1/1990"]}'
 * @param {object|null} value Value to transform
 * @returns {string|null} Tranformed string or null
 */
export function jsonToPreviousString(value) {
  // Handle the case where value is empty string, undefined or null
  if (value === null || value === undefined) {
    return null;
  }

  // Do not allow storing any other type of values than stringified objects
  // For fields that require JSON value to work.
  // This allows database to self-repair itself over time
  if (typeof value !== 'object') {
    throw new Error('Invalid type to transform to string format.');
  }

  return JSON.stringify(Object.entries(value).reduce((acc, [k, v]) => ({...acc, [camelcaseToUnderscore(k)]: v}), {}));

  function camelcaseToUnderscore(v) {
    return v.replace(/[A-Z]/gu, (m) => `_${m.toLowerCase()}`);
  }
}

/**
 * Transforms JSON string stored to DB to object. Used by issn-registry models virtual getters.
 *   - FROM: '{"title":["Foo Series"],"issn":["1797-0024"],"last_issue":["1/1990"]}'
     - TO: {"title": ["Foo Series"], "issn": ["1797-0024"], "lastIssue": ["1/1990"]}
 * @param {string|null} value Value to transform
 * @returns {object} Object parsed from the value
 */
export function previousStringToJson(value) {
  // Handle case where value is not defined or is explicitly set as null
  if (value === null || value === undefined) {
    return value;
  }

  // If DB column should contain JSON value, but contains empty string instead, act like the value was not defined
  // Since there really is no information regarding the column stored
  if (value === '') {
    return null;
  }

  return Object.entries(JSON.parse(value)).reduce((acc, [k, v]) => ({...acc, [underscoreToCamelcase(k)]: v}), {});

  function underscoreToCamelcase(v) {
    return v.replace(/_(?<key>[a-z]{1})/gu, (m, key) => `${key.toUpperCase()}`);
  }
}
