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

import testSuiteFactory from '../testUtils';

describe('app', () => {
  const generateTestSuite = testSuiteFactory({
    rootPath: [
      __dirname,
      '..',
      '..',
      '..',
      'test-fixtures',
      'isbn-registry',
      'identifierBatches'
    ]
  });
  describe('ISBN-registry identifier batches', () => {
    // ISBN
    describe('#createIsbn', generateTestSuite('isbn', 'create'));
    describe('#deleteIsbn', generateTestSuite('isbn', 'delete'));

    // ISMN
    describe('#createIsmn', generateTestSuite('ismn', 'create'));
    describe('#deleteIsmn', generateTestSuite('ismn', 'delete'));

    // BOTH
    describe('#readIsbn', generateTestSuite('common', 'read'));
    describe('#queryIsbn', generateTestSuite('common', 'query'));
    describe('#download', generateTestSuite('common', 'download'));
  });
});
