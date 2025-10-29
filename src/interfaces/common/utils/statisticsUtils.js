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

import * as xl from 'excel4node';
import {Parser} from '@json2csv/plainjs';

import {DB_TYPES} from '../../../models/constants';

export function formatStatisticsToCsv(jsonData) {
  const parser = new Parser({});
  return parser.parse(jsonData);
}

export function formatStatisticsToXlsx(statisticsType, jsonData) {
  const wb = new xl.Workbook({author: 'National Library of Finland'});
  writeDataToSheet(statisticsType, jsonData, wb);

  return wb;

  function writeDataToSheet(statisticsType, jsonData, wb) {
    // Most statistics workbooks require only one worksheet
    const ws = wb.addWorksheet(statisticsType);

    if (statisticsType.startsWith('ISBN_REGISTRY_PROGRESS_')) {
      return writeIsbnRegistryProgressStatistics(jsonData, ws);
    }

    if (statisticsType.startsWith('ISBN_REGISTRY_PUBLISHERS_') || statisticsType.startsWith('ISBN_REGISTRY_PUBLICATIONS_')) {
      return writeData(jsonData, ws);
    }

    if (statisticsType === 'ISBN_REGISTRY_MONTHLY') {
      return writeIsbnRegistryMonthlyStatistics(jsonData, ws);
    }

    if (statisticsType === 'ISSN_REGISTRY_ISSN') {
      const ws2 = wb.addWorksheet(`${statisticsType}_2`);
      return writeIssnRegistryIssnStatistics(jsonData, ws, ws2);
    }

    if (statisticsType === 'ISSN_REGISTRY_PUBLISHERS') {
      return writeIssnRegistryPublisherStatistics(jsonData, ws);
    }

    if (statisticsType === 'ISSN_REGISTRY_PUBLICATIONS') {
      return writeIssnRegistryPublicationStatistics(jsonData, ws);
    }

    if (statisticsType === 'ISSN_REGISTRY_FORMS') {
      return writeIssnRegistryFormStatistics(jsonData, ws);
    }

    return;
  }

  function writeIsbnRegistryProgressStatistics(jsonData, ws) {
    return writeData(jsonData, ws);
  }

  function writeIsbnRegistryMonthlyStatistics(jsonData, ws) {
    return writeData(jsonData, ws);
  }

  function writeIssnRegistryIssnStatistics(jsonData, ws, ws2) {
    const [sheetData1, sheetData2] = jsonData.sheets;

    writeData(sheetData1, ws);
    writeData(sheetData2, ws2);
  }

  function writeIssnRegistryPublisherStatistics(jsonData, ws) {
    return writeData(jsonData, ws);
  }

  function writeIssnRegistryPublicationStatistics(jsonData, ws) {
    return writeData(jsonData, ws);
  }

  function writeIssnRegistryFormStatistics(jsonData, ws) {
    return writeData(jsonData, ws);
  }

  function writeData(jsonData, ws) {
    // Data must be in format of array of objects
    if (!canFormatStatistics(jsonData)) {
      return;
    }

    // First objects attributes are used as headers
    const headers = Object.keys(jsonData[0]);

    // Columns generation loop
    headers.forEach((header, idx) => {
      const columnIdx = idx + 1;
      ws.cell(1, columnIdx)
        .string(String(header))
        .style({font: {bold: true}});

      // Rows generation loop
      jsonData.forEach((entry, entryIdx) => {
        // Row number is entryIdx + 2 since entryIdx indexing starts at 0 and in first index is the header
        const rowIdx = entryIdx + 2;
        ws.cell(rowIdx, columnIdx).string(String(entry[header]));
      });
    });

    return ws;
  }
}

function canFormatStatistics(jsonData) {
  return Array.isArray(jsonData) && jsonData.length > 0 && typeof jsonData[0] === 'object';
}

/**
 * Get SQL query definition regarding parameters that differ depending on chosen database type (e.g., SQLite does not know MONTH function)
 * @param {(sqlite|mariadb|mysql)} dbType Type of database
 * @param {(year|month)} typeOfTransform Type of query to transform
 * @param {string} variableName Name of variable to include to query
 * @returns String containing the transformed portion of SQL query
 */
export function getSQLDateDefinition(dbType, typeOfTransform, variableName) {
  if (!Object.keys(DB_TYPES).includes(dbType)) {
    throw new Error('Unsupported database type for SQL query transformation');
  }

  const supportedTransformations = {year: 'year', month: 'month'};
  if (!Object.keys(supportedTransformations).includes(typeOfTransform)) {
    throw new Error('Unsupported SQL query transformation type');
  }

  // SQLite does not support YEAR and MONTH functions so implement queries utilizing substring
  if (dbType === DB_TYPES.sqlite) {
    if (typeOfTransform === supportedTransformations.year) {
      return `SUBSTRING(${variableName}, 1, 4)`;
    }

    if (typeOfTransform === supportedTransformations.month) {
      return `SUBSTRING(${variableName}, 6, 2)`;
    }

    throw new Error('Unsupported SQL query transformation for selected database type');
  }

  if ([DB_TYPES.mariadb, DB_TYPES.mysql].includes(dbType)) {
    if (typeOfTransform === supportedTransformations.year) {
      return `YEAR(${variableName})`;
    }

    if (typeOfTransform === supportedTransformations.month) {
      return `MONTH(${variableName})`;
    }

    throw new Error('Unsupported SQL query transformation for selected database type');
  }

  throw new Error('Unknown unsupported SQL query transformation definition');
}
