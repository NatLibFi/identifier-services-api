
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

import testSuiteFactory from './testUtils';

describe('app', () => {
	const generateTestSuite = testSuiteFactory({
		rootPath: [__dirname, '..', '..', 'test-fixtures']
	});

	describe('users', () => {
		describe('#readRequest', generateTestSuite('users', 'readRequest'));
		// describe('#create', generateTestSuite('users', 'create'));
		// describe('#changePwd', generateTestSuite('users', 'changePwd'));
		// describe('#query', generateTestSuite('users', 'query'));
		// describe('#delete', generateTestSuite('users', 'delete'));
		// describe('#update', generateTestSuite('users', 'update'));
	});
});

// import HttpStatus from 'http-status';
// import {PASSPORT_LOCAL_USERS, LOCAL_USERS_TEST} from '../config';
// import fixtureFactory, {READERS} from '@natlibfi/fixura';
// import mongoFixturesFactory from '@natlibfi/fixura-mongo';
// import startApp, {__RewireAPI__ as RewireAPI} from '../app'; // eslint-disable-line import/named
// import chai, {expect} from 'chai';
// import chaiHttp from 'chai-http';
// import base64 from 'base-64';
// import fs from 'fs';
// import {formatUrl} from '../utils';

// chai.use(chaiHttp);

// describe('routes/requests/users', () => {
// 	let requester;
// 	let mongoFixtures;
// 	const fixturesPath = [__dirname, '..', '..', 'test-fixtures', 'users'];
// 	const requestPath = '/requests/users';
// 	const {getFixture} = fixtureFactory({root: fixturesPath});
// 	const readLocalUsers = fs.readFileSync(formatUrl(LOCAL_USERS_TEST), 'utf-8');
// 	const localUsersCredentials = JSON.parse(readLocalUsers);

// 	beforeEach(async () => {
// 		mongoFixtures = await mongoFixturesFactory({rootPath: fixturesPath, useObjectId: true});
// 		RewireAPI.__Rewire__('MONGO_URI', await mongoFixtures.getConnectionString());
// 		RewireAPI.__Rewire__('PASSPORT_LOCAL_USERS', PASSPORT_LOCAL_USERS);
// 		const app = await startApp();

// 		requester = chai.request(app).keepOpen();
// 	});

// 	afterEach(async () => {
// 		await requester.close();
// 		await mongoFixtures.close();
// 		RewireAPI.__ResetDependency__('MONGO_URI');
// 	});

// 	const admin = 0;
// 	const system = 1;
// 	const publisherAdmin = 2;

// 	async function auth(role) {
// 		const result = await requester.post('/auth').set('Authorization', 'Basic ' + base64.encode(localUsersCredentials[role].user + ':' + localUsersCredentials[role].password)
// 		);
// 		return result.headers.token;
// 	}

// 	describe('#readRequest', () => {
// 		it.skip('Should succeed, admins are able to read all request', async (index = '0') => {
// 			const {expectedPayload} = await init(index, true);
// 			const token = await auth(admin);
// 			const response = await requester.get(`${requestPath}/5cd3e9e5f2376736726e4c19`).set('Authorization', `Bearer ${token}`);
// 			expect(response).to.have.status(HttpStatus.OK);
// 			expect(response.body).to.eql(expectedPayload);
// 		});

// 		it.skip('Should succeed reading request related to user', async (index = '1') => {
// 			const {expectedPayload} = await init(index, true);
// 			const token = await auth(publisherAdmin);
// 			const response = await requester.get(`${requestPath}/5cd3e9e5f2376736726e4c19`).set('Authorization', `Bearer ${token}`);
// 			expect(response).to.have.status(HttpStatus.OK);
// 			expect(response.body).to.eql(expectedPayload);
// 		});

// 		/* NEED TO CONFIRM ABOUT THE PERMISSION BEFORE PROCEEDING */

// 		// it('Should fail reading request not related to user', async (index = '2') => {
// 		// 	await init(index);
// 		// 	const token = await auth(publisherAdmin);
// 		// 	const response = await requester.get(`${requestPath}/5cd3e9e5f2376736726e4c19`).set('Authorization', `Bearer ${token}`);
// 		// 	expect(response).to.have.status(HttpStatus.UNAUTHORIZED);
// 		// });

// 		it.skip('Should fail, could not connect to database', async () => {
// 			const token = await auth(admin);
// 			const response = await requester.get(`${requestPath}/5cd3e9e5f2376736726e4c19`).set('Authorization', `Bearer ${token}`);
// 			expect(response).to.have.status(HttpStatus.NOT_FOUND);
// 		});

// 		it.skip('Should fail because the resource does not exist', async (index = '3') => {
// 			await init(index);
// 			const token = await auth(admin);
// 			const response = await requester.get(`${requestPath}/5cd3e9e5f2376736726e4c19`).set('Authorization', `Bearer ${token}`);
// 			expect(response).to.have.status(HttpStatus.NOT_FOUND);
// 		});

// 		async function init(index, getFixtures = false) {
// 			await mongoFixtures.populate(['readRequest', index, 'dbContents.json']);
// 			if (getFixtures) {
// 				return {
// 					expectedPayload: getFixture({components: ['readRequest', index, 'expectedPayload.json'], reader: READERS.JSON})
// 				};
// 			}
// 		}
// 	});

// 	describe('#createRequest', () => {
// 		it.skip('Should succeed without SSOID', async (index = '0') => {
// 			await mongoFixtures.populate(['createRequest', index, 'dbContents.json']);
// 			const {payload} = await init(index, true);
// 			const token = await auth(publisherAdmin);
// 			const response = await requester.post(`${requestPath}`).set('Authorization', `Bearer ${token}`).send(payload);
// 			expect(response).to.have.status(HttpStatus.OK);

// 			const db = await mongoFixtures.dump();
// 			const {expectedDb} = await init(index, false);
// 			expect(formatDump(db)).to.eql(formatDump(expectedDb));
// 		});

// 		it.skip('Should succeed using SSOID', async (index = '0') => {
// 			await mongoFixtures.populate(['createRequest', index, 'dbContents.json']);
// 			const {payload} = await init(index, true);
// 			const token = await auth(publisherAdmin);
// 			const response = await requester.post(`${requestPath}`).set('Authorization', `Bearer ${token}`).send(payload);
// 			expect(response).to.have.status(HttpStatus.OK);

// 			const db = await mongoFixtures.dump();
// 			const {expectedDb} = await init(index, false);
// 			expect(formatDump(db)).to.eql(formatDump(expectedDb));
// 		});

// 		it.skip('Should fail because no db connected', async (index = '2') => {
// 			const token = await auth(publisherAdmin);
// 			const {payload} = await init(index, true);
// 			const response = await requester.post(`${requestPath}`).set('Authorization', `Bearer ${token}`).send(payload);
// 			expect(response).to.have.status(HttpStatus.NOT_FOUND);
// 		});

// 		it.skip('Should not succeed because resource is empty', async (index = '3') => {
// 			await mongoFixtures.populate(['createRequest', index, 'dbContents.json']);
// 			const token = await auth(publisherAdmin);
// 			const response = await requester.post(`${requestPath}`).set('Authorization', `Bearer ${token}`).send();
// 			expect(response).to.have.status(HttpStatus.UNPROCESSABLE_ENTITY);
// 		});

// 		async function init(index, getFixtures = false) {
// 			if (getFixtures) {
// 				return {
// 					payload: getFixture({components: ['createRequest', index, 'payload.json'], reader: READERS.JSON})
// 				};
// 			}

// 			return {
// 				expectedDb: getFixture({components: ['createRequest', index, 'dbExpected.json'], reader: READERS.JSON})
// 			};
// 		}
// 	});

// 	describe('#deleteRequest', () => {
// 		it.skip('Should succeed', async (index = '0') => {
// 			await mongoFixtures.populate(['deleteRequest', index, 'dbContents.json']);
// 			const token = await auth(system);
// 			const response = await requester.delete(`${requestPath}/5cd3e9e5f2376736726e4d23`).set('Authorization', `Bearer ${token}`);
// 			expect(response).to.have.status(HttpStatus.OK);
// 			const db = await mongoFixtures.dump();
// 			const {expectedDb} = await init(index);
// 			expect(response).to.have.status(HttpStatus.OK);
// 			expect(formatDump(db)).to.eql(formatDump(expectedDb));
// 		});

// 		it.skip('Should fails, not enough access to admin', async (index = '0') => {
// 			await mongoFixtures.populate(['deleteRequest', index, 'dbContents.json']);
// 			const token = await auth(admin);
// 			const adminResponse = await requester.delete(`${requestPath}/5cd3e9e5f2376736726e4d23`).set('Authorization', `Bearer ${token}`);
// 			expect(adminResponse).to.have.status(HttpStatus.FORBIDDEN);

// 			const publisherAdmintoken = await auth(publisherAdmin);
// 			const publisherAdminResponse = await requester.delete(`${requestPath}/5cd3e9e5f2376736726e4d23`).set('Authorization', `Bearer ${publisherAdmintoken}`);
// 			expect(publisherAdminResponse).to.have.status(HttpStatus.FORBIDDEN);
// 		});

// 		it.skip('Should not succeed because of wrong parameters', async (index = '1') => {
// 			await mongoFixtures.populate(['deleteRequest', index, 'dbContents.json']);
// 			const token = await auth(publisherAdmin);
// 			const response = await requester.delete(`${requestPath}/`).set('Authorization', `Bearer ${token}`);
// 			expect(response).to.have.status(HttpStatus.NOT_FOUND);
// 		});

// 		async function init(index) {
// 			return {
// 				expectedDb: getFixture({components: ['deleteRequest', index, 'dbExpected.json'], reader: READERS.JSON})
// 			};
// 		}
// 	});

// 	describe('#updateRequest', () => {
// 		it.skip('Should succeed', async (index = '0') => {
// 			await mongoFixtures.populate(['updateRequest', index, 'dbContents.json']);
// 			const {payload} = await init(index, true);
// 			const token = await auth(admin);
// 			const response = await requester.put(`${requestPath}/5cd3e9e5f2376736726e4d23`).set('Authorization', `Bearer ${token}`).send(payload);
// 			expect(response).to.have.status(HttpStatus.OK);

// 			const db = await mongoFixtures.dump();
// 			const {expectedDb} = await init(index, false);
// 			expect(formatDump(db)).to.eql(formatDump(expectedDb));
// 		});

// 		it.skip('Should not succeed because of worng parameter', async (index = '1') => {
// 			await mongoFixtures.populate(['updateRequest', index, 'dbContents.json']);
// 			const {payload} = await init(index, true);
// 			const token = await auth(admin);
// 			const response = await requester.put(`${requestPath}/foo`).set('Authorization', `Bearer ${token}`).send(payload);
// 			expect(response).to.have.status(HttpStatus.UNPROCESSABLE_ENTITY);
// 		});

// 		it.skip('Should not succeed because input was not provided', async (index = '1') => {
// 			await mongoFixtures.populate(['updateRequest', index, 'dbContents.json']);
// 			const response = await requester.put(`${requestPath}/5cdc1706d435475787f4751d`).set('content-type', 'application/json').send();
// 			expect(response).to.have.status(HttpStatus.UNPROCESSABLE_ENTITY);
// 		});

// 		async function init(index, getFixtures = false) {
// 			if (getFixtures) {
// 				return {
// 					payload: getFixture({components: ['updateRequest', index, 'payload.json'], reader: READERS.JSON})
// 				};
// 			}

// 			return {
// 				expectedDb: getFixture({components: ['updateRequest', index, 'dbExpected.json'], reader: READERS.JSON})
// 			};
// 		}
// 	});

// 	function formatDump(dump) {
// 		dump.usersRequest.forEach(doc =>
// 			Object.values(doc).forEach(field => Object.keys(field).filter(item =>
// 				item === 'timestamp' || item === 'user'
// 			).forEach(i => delete doc.lastUpdated[i]))
// 		);
// 		return dump;
// 	}
// });

