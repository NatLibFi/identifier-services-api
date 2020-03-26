
/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * API microservice of Identifier Services
 *
 * Copyright (C) 2019 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of identifier-services-api
 *
 * identifier-services-api program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * identifier-services-api is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 */
import chai, {expect} from 'chai';
import chaiHttp from 'chai-http';
import HttpStatus from 'http-status';
import fixtureFactory, {READERS} from '@natlibfi/fixura';
import mongoFixturesFactory from '@natlibfi/fixura-mongo';
import startApp, {__RewireAPI__ as RewireAPI} from '../app';
import {readdirSync} from 'fs';
import {join as joinPath} from 'path';
import {ApiError} from '@natlibfi/identifier-services-commons/dist/error';
import base64 from 'base-64';
import generateUserProvider from '../../test-fixtures/mockUserProvider';

chai.use(chaiHttp);

export default ({rootPath}) => {
  let requester;// eslint-disable-line functional/no-let
  let mongoFixtures;// eslint-disable-line functional/no-let

  after(() => {
    RewireAPI.__ResetDependency__('MONGO_URI');
  });

  afterEach(async () => {
    await requester.close();
    await mongoFixtures.close();
    RewireAPI.__ResetDependency__('MONGO_URI');
    RewireAPI.__ResetDependency__('PASSPORT_LOCAL_USERS');
  });

  return (...args) => () => {
    const dir = rootPath.concat(args);
    const {getFixture} = fixtureFactory({root: dir});
    const subDirs = readdirSync(joinPath(...dir));
    return iterate();
    function iterate() {
      subDirs.forEach(sub => {
        const PASSPORT_LOCAL_USERS = `file://${joinPath(...dir)}/${sub}/local.json`;
        if (sub) {
          const {
            descr,
            skip,
            expectedPayload,
            requestUrl,
            method,
            username,
            password,
            expectedStatus,
            expectedDb,
            payloadData,
            payloadExpected,
            collectionName
          } = getData(sub);

          if (skip) {
            return it.skip(`${sub} ${descr}`);
          }
          return it(`${sub} ${descr}`, async () => {
            mongoFixtures = await mongoFixturesFactory({rootPath: dir, useObjectId: true});
            RewireAPI.__Rewire__('MONGO_URI', await mongoFixtures.getConnectionString());
            RewireAPI.__Rewire__('PASSPORT_LOCAL_USERS', PASSPORT_LOCAL_USERS);
            RewireAPI.__Rewire__('generateUserProvider', generateUserProvider);

            const app = await startApp();
            requester = chai.request(app).keepOpen();
            await mongoFixtures.populate([
              sub,
              'dbContents.json'
            ]);
            const token = await auth(username, password);
            if (expectedPayload) {
              const conditionalRequest = token === undefined
                ? await requester[method](requestUrl)
                : await requester[method](requestUrl)
                  .set('Authorization', `Bearer ${token}`);

              const response = payloadData
                ? await requester[method](requestUrl)
                  .set('Authorization', `Bearer ${token}`)
                  .send(payloadData)
                : conditionalRequest;
              expect(response).to.have.status(expectedStatus);
              if (expectedStatus === HttpStatus.OK) {
                return expect(response.body).to.eql(expectedPayload);
              }
            }

            if (expectedDb) {
              const response = payloadData
                ? await requester[method](requestUrl)
                  .set('Authorization', `Bearer ${token}`)
                  .send(payloadData)
                : await requester[method](requestUrl)
                  .set('Authorization', `Bearer ${token}`);
              expect(response).to.have.status(expectedStatus);
              if (response.status === HttpStatus.OK) {
                const db = await mongoFixtures.dump();
                return expect(formatDump(db, collectionName)).to.eql(expectedDb);
              }
            }

            if (expectedDb === undefined && payloadExpected === undefined) {
              const conditionalRequest = payloadData
                ? await requester[method](requestUrl)
                  .set('Authorization', `Bearer ${token}`)
                  .send(payloadData)
                : await requester[method](requestUrl)
                  .set('Authorization', `Bearer ${token}`);

              const response = method === 'delete'
                ? await requester[method](requestUrl)
                  .set('Authorization', `Bearer ${token}`)
                : conditionalRequest;
              return expect(response).to.have.status(expectedStatus);
            }
          });
        }
      });
    }

    function getData(subDir) {
      const {descr, collectionName, requestUrl, method, skip, username, password, expectedStatus, dbExpected, payload, payloadExpected = true} = getFixture({
        components: [
          subDir,
          'metadata.json'
        ],
        reader: READERS.JSON
      });
      const payloadData = payload && getFixture({
        components: [
          subDir,
          payload
        ],
        reader: READERS.JSON
      });

      if (skip) {
        return {descr, skip};
      }

      try {
        if (dbExpected) {
          const expectedDb = getFixture({
            components: [
              subDir,
              dbExpected
            ],
            reader: READERS.JSON
          });
          return payload
            ? {descr, collectionName, requestUrl, method, username, password, expectedStatus, expectedDb, payloadData}
            : {descr, collectionName, requestUrl, method, username, password, expectedStatus, expectedDb};
        }

        if (payloadExpected) {
          const expectedPayload = getFixture({
            components: [
              subDir,
              'expectedPayload.json'
            ],
            reader: READERS.JSON
          });
          return payload
            ? {expectedPayload, descr, collectionName, requestUrl, method, username, password, expectedStatus, payloadData}
            : {expectedPayload, descr, collectionName, requestUrl, method, username, password, expectedStatus, payloadExpected};
        }

        if (dbExpected === undefined && payloadExpected === false) {
          return {descr, requestUrl, method, username, password, expectedStatus, payloadData};
        }
      } catch (err) {
        if (err.code === 'ENOENT') {
          return {descr, requestUrl};
        }

        throw new ApiError(err.status);
      }
    }

    async function auth(username, password) {
      const result = await requester.post('/auth').set('Authorization', `Basic ${base64.encode(`${username}:${password}`)}`);
      return result.headers.token;
    }

    function formatDump(dump, collectionName) {
      const result = dump[collectionName].map(doc => filterDoc(doc));
      return {...dump, [collectionName]: result};

      function filterDoc(doc) {
        return Object.entries(doc)
          .reduce((acc, [
            k,
            value
          ]) => k === 'lastUpdated' ? {...acc, [k]: {}} : {...acc, [k]: value}, {});
      }
    }
  };
};
