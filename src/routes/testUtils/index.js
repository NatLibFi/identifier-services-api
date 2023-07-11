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

import chai, {expect} from 'chai';
import chaiHttp from 'chai-http';
import fixtureFactory, {READERS} from '@natlibfi/fixura';
import startApp from '../../app';
import {readdirSync, statSync} from 'fs';
import {join as joinPath} from 'path';
import base64 from 'base-64';

import pgFixturesFactory from './dbUtils';

import {SEND_EMAILS} from '../../config';

chai.use(chaiHttp);

export default ({rootPath}) => {
  // Refuse to run tests if SEND_EMAILS has invalid configuration
  if (SEND_EMAILS === true) {
    throw new Error('Won\'t run automated tests when SEND_EMAILS is set to true. Set SEND_EMAILS to false and try again.');
  }

  let requester; // eslint-disable-line functional/no-let

  afterEach(async () => {
    await requester.close();
  });

  return (...args) => () => {
    const dir = rootPath.concat(args);
    const testRoot = joinPath(...dir);

    // Do not proceed if test folder does not exist
    if (!exists(testRoot)) {
      return;
    }

    const {getFixture} = fixtureFactory({root: dir});
    const subDirs = readdirSync(testRoot);

    return iterate();

    function iterate() {
      subDirs.forEach(sub => {
        const TEST_ROOT = `${joinPath(...dir)}/${sub}`;

        if (sub) {
          const {
            descr,
            skip,
            requestUrl,
            method,
            username,
            password,
            expectedStatus,
            payloadData,
            dbInitRequired,
            expectedDb,
            expectedPayload,
            expectedHeaders,
            authTestHeader
          } = getData(sub, TEST_ROOT);

          if (skip) {
            return it.skip(`${sub} ${descr}`);
          }

          /* eslint-disable max-statements */
          return it(`${sub} ${descr}`, async () => {
            const pgFixtures = await pgFixturesFactory({rootPath: dir});
            await pgFixtures.populate([sub, 'dbContents.json'], dbInitRequired);

            const app = await startApp();
            requester = chai.request(app).keepOpen();

            const token = await auth(username, password);

            // Request is crafted on basis whether there is token and payload/payload headers
            const response = await testRequestWithPayload(authTestHeader, payloadData);

            // In all cases the response needs to have expected status
            expect(response).to.have.status(expectedStatus);

            // If expected payload was defined, it needs to be met
            // Separate filtering regarding timestamps is required for three types of requests:
            //   1. Endpoints returning arrays
            //   2. Endpoints returning result of queries ({totalDoc, results})
            //   3. Endpoints returning objects
            /* eslint-disable functional/no-conditional-statements */
            if (expectedPayload) {
              if (Array.isArray(response.body)) {
                expect(response.body.map(doc => filterDoc(doc))).to.eql(expectedPayload);
              } else if (Object.prototype.hasOwnProperty.call(response.body, 'results')) {
                expect(response.body.results.map(doc => filterDoc(doc))).to.eql(expectedPayload.results);
                expect(response.body.totalDoc).to.eql(expectedPayload.totalDoc);
              } else {
                expect(filterDoc(response.body)).to.eql(expectedPayload);
              }
            }
            // If expected headers were defined, they need to be met
            if (expectedHeaders) {
              expectedHeaders.forEach(h => expect(response).to.have.header(h));
            }

            // If a database state was defined, it needs to be met
            if (expectedDb) {
              const db = await pgFixtures.dump();
              expect(formatDump(db)).to.eql(expectedDb);
            }
            /* eslint-enable functional/no-conditional-statements */
            return;

            // Generate test request based on whether authorization header and payload are defined:
            // 1. Authentication test (requires specific headers)
            // 2. Tests having payload data
            // 3. Test that do not have payload data
            // eslint-disable-next-line require-await
            async function testRequestWithPayload(authTestHeader = false, payloadData = false) {
              if (authTestHeader) {
                return requester[method](requestUrl).set('Authorization', `Basic ${authTestHeader}`);
              }

              if (payloadData) {
                if (token === undefined) { // njsscan-ignore: node_timing_attack
                  return requester[method](requestUrl).send(payloadData);
                }

                return requester[method](requestUrl).set('Authorization', `Bearer ${token}`).send(payloadData);
              }

              if (token === undefined) { // njsscan-ignore: node_timing_attack
                return requester[method](requestUrl);
              }

              return requester[method](requestUrl).set('Authorization', `Bearer ${token}`);
            }
          });
        }
      });
    }

    function getData(subDir, testRoot) {

      // Metadata is always loaded
      const {descr, requestUrl, method, skip, username, password, expectedStatus, expectedHeaders, authTestHeader} = getFixture({
        components: [
          subDir,
          'metadata.json'
        ],
        reader: READERS.JSON
      });

      if (skip) {
        return {descr, skip};
      }

      try {
        // Load payload if payload.json exist
        const payloadPath = `${testRoot}/payload.json`;
        const payloadExists = exists(payloadPath);
        const payloadData = payloadExists
          ? getFixture({
            components: [
              subDir,
              'payload.json'
            ],
            reader: READERS.JSON
          })
          : false;

        // Load db if dbExpected.json exist
        const dbExpectedPath = `${testRoot}/dbExpected.json`;
        const dbExpectedExists = exists(dbExpectedPath);
        const expectedDb = dbExpectedExists
          ? getFixture({
            components: [
              subDir,
              'dbExpected.json'
            ],
            reader: READERS.JSON
          })
          : false;

        // Does test require db init
        const dbContentsPath = `${testRoot}/dbContents.json`;
        const dbInitRequired = exists(dbContentsPath);

        // Load expected payload if expectedPayload.json exist
        const expectedPayloadPath = `${testRoot}/expectedPayload.json`;
        const expectedPayloadExists = exists(expectedPayloadPath);
        const expectedPayload = expectedPayloadExists
          ? getFixture({
            components: [
              subDir,
              'expectedPayload.json'
            ],
            reader: READERS.JSON
          })
          : false;

        return {
          descr,
          skip,
          requestUrl,
          method,
          username,
          password,
          expectedStatus,
          payloadData,
          dbInitRequired,
          expectedDb,
          expectedPayload,
          expectedHeaders,
          authTestHeader
        };

      } catch (err) {
        if (err.code === 'ENOENT') {
          return {descr, requestUrl};
        }

        throw new Error(`Encountered an error: ${err}`);
      }
    }

    async function auth(username, password) {
      const result = await requester.post('/auth').set('Authorization', `Basic ${base64.encode(`${username}:${password}`)}`);
      return result.body.authenticationToken;
    }
  };

  function exists(p) {
    try {
      statSync(p);
      return true;
    } catch {
      return false;
    }
  }

  function formatDump(dump) {
    /* eslint-disable no-mixed-operators */
    const result = {};

    // Each item in table is formatted so that it does not contain timestamps
    // Regarding attribute "canceled" this means, if it does not represent number (like number of canceled identifiers) it is formatted as empty object
    // Empty tables are not returned so in case of emtpy db returned value is empty object
    dump.forEach(table => Object.keys(table).filter(k => table[k].length > 0).forEach(k => {
      result[k] = table[k].map(doc => removeAttributes(doc, true)); // eslint-disable-line functional/immutable-data
    }));

    return result;
  }

  // Filters some unpredictable information, such as timestamps, from response
  function filterDoc(doc) {
    return removeAttributes(doc);
  }

  function removeAttributes(v, dbDump = false) {
    const timestampAttr = [
      'modified',
      'created',
      'sent',
      'canceled'
    ];

    return Object.keys(v).reduce((acc, k) => {
      if (Array.isArray(v[k])) {
        return {...acc, [k]: v[k].map(value => isObject(value) ? removeAttributes(value, dbDump) : value)};
      }

      if (timestampAttr.includes(k) && isNaN(Number(v[k]))) {
        return {...acc, [k]: {}};
      }

      if (isObject(v[k])) {
        return {...acc, [k]: removeAttributes(v[k], dbDump)};
      }

      return {...acc, [k]: v[k]};
    }, {});

    function isObject(v) {
      return v !== null && !Array.isArray(v) && typeof v === 'object';
    }
  }
};
