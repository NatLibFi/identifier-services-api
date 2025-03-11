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

import {Sequelize} from 'sequelize';

import {createLogger} from '@natlibfi/melinda-backend-commons';

import {DB_URI, DB_DIALECT, DB_DIALECT_OPTIONS, NODE_ENV, DB_BENCHMARK_ENABLED} from '../config';
import {DB_TYPES} from './constants';
import {isMysqlOrMaria, isValidDatabaseDialect} from './utils';

import * as isbnRegistryModels from './isbn-registry';
import applyIsbnRegistryAssociations from './isbn-registry/associations';

import * as issnRegistryModels from './issn-registry';
import applyIssnRegistryAssociations from './issn-registry/associations';

import * as commonModels from './common';

/* eslint-disable functional/no-let,functional/no-conditional-statements,no-process-env */
let sequelize;

const logger = createLogger();

// Guards to check validity of dialect configuration
if (NODE_ENV === 'test' && DB_DIALECT !== DB_TYPES.sqlite) {
  throw new Error('Wont run automated tests if db dialect is not set to sqlite');
}

if (!isValidDatabaseDialect(DB_DIALECT)) {
  throw new Error(`Dialect for ${DB_DIALECT} is not supported database dialect`);
}

// Use SQLite in-memory for automated tests
if (NODE_ENV === 'test') {
  logger.debug('using in-memory SQLite as database');
  sequelize = new Sequelize('sqlite::memory', {logging: false});
} else {
  const applyEngineDefinitions = isMysqlOrMaria(DB_DIALECT);

  logger.info(`using DB dialect of "${DB_DIALECT}"`);
  logger.info(`apply DB engine definitions regarding engine, charset and collate: ${applyEngineDefinitions}`);

  const logDbBenchmark = (_message, timeMS) => logger.debug(`SQL took ${timeMS}ms`);

  sequelize = new Sequelize(DB_URI, {
    dialect: DB_DIALECT,
    dialectOptions: DB_DIALECT_OPTIONS,
    define: applyEngineDefinitions ? {
      engine: 'InnoDB',
      charset: 'utf8mb3',
      collate: 'utf8mb3_swedish_ci'
    } : undefined,
    benchmark: DB_BENCHMARK_ENABLED,
    logging: DB_BENCHMARK_ENABLED ? logDbBenchmark : false
  });
}

// Define models
const models = [
  ...Object.keys(isbnRegistryModels).map(k => isbnRegistryModels[k]),
  ...Object.keys(issnRegistryModels).map(k => issnRegistryModels[k]),
  ...Object.keys(commonModels).map(k => commonModels[k])
];

// Use sequelize instance to initiate models
models.forEach(model => model(sequelize, DB_DIALECT));

// Apply associations
applyIsbnRegistryAssociations(sequelize);
applyIssnRegistryAssociations(sequelize);

export default sequelize;
