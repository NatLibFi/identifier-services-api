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
      'test-fixtures'
    ]
  });

  describe('ISBN-registry marc', () => {
    describe('#get-record', generateTestSuite('isbn-registry', 'marc', 'get-record'));
    describe('#send-to-melinda', generateTestSuite('isbn-registry', 'marc', 'send-to-melinda'));
    describe('#search-from-melinda', generateTestSuite('isbn-registry', 'marc', 'search-from-melinda'));
  });

  describe('ISSN-registry marc', () => {
    describe('#get-record', generateTestSuite('issn-registry', 'marc', 'get-record'));
    describe('#search-from-melinda', generateTestSuite('issn-registry', 'marc', 'search-from-melinda'));
    describe('#send-to-melinda', generateTestSuite('issn-registry', 'marc', 'send-to-melinda'));
  });
});
