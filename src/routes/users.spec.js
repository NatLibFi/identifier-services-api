
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

// describe('routes/users', () => {
// 	let requester;
// 	let mongoFixtures;
// 	const fixturesPath = [__dirname, '..', '..', 'test-fixtures', 'users'];
// 	const requestPath = '/users';
// 	const {getFixture} = fixtureFactory({root: fixturesPath});
// 	const readAuthProvider = fs.readFileSync(formatUrl(PASSPORT_LOCAL_USERS), 'utf-8');
// 	// const readLocalUsers = fs.readFileSync(formatUrl(LOCAL_USERS_TEST), 'utf-8');
// 	// const localUsersCredentials = JSON.parse(readLocalUsers);

// 	afterEach(async () => {
// 		await requester.close();
// 		await mongoFixtures.close();
// 		RewireAPI.__ResetDependency__('MONGO_URI');
// 	});

// 	const admin = 0;
// 	const system = 1;
// 	const publisherAdmin = 2;

// 	async function auth(username, password) {
// 		const result = await requester.post('/auth').set('Authorization', 'Basic ' + base64.encode(username + ':' + password)
// 		);
// 		return result.headers.token;
// 	}

// 	describe('#read', async (index = '0') => {
// 		await init(index, true, true, true);
// 		it('descr', async () => {
// 			// const {expectedPayload, descr, requestUrl, user, password} = await init(index, true, true, true);
// 			// console.log(descr, requestUrl, user, password)
// 			// const token = await auth(user, password);
// 			// const response = await requester.get(requestUrl).set('Authorization', `Bearer ${token}`);
// 			// expect(response).to.have.status(HttpStatus.OK);
// 			// expect(response.body).to.eql(expectedPayload);
// 		});

// 		it.skip('Should succeed', async (index = '0') => {
// 			const {expectedPayload} = await init(index, true);
// 			const token = await auth(admin);
// 			const response = await requester.get(`${requestPath}/admin`).set('Authorization', `Bearer ${token}`);
// 			expect(response).to.have.status(HttpStatus.OK);
// 			expect(response.body).to.eql(expectedPayload);
// 		});

// 		it.skip('Should succeed', async (index = '1') => {
// 			const {expectedPayload} = await init(index, true);
// 			const token = await auth(publisherAdmin);
// 			const response = await requester.get(`${requestPath}/publisher-admin`).set('Authorization', `Bearer ${token}`);
// 			expect(response).to.have.status(HttpStatus.OK);
// 			expect(response.body).to.eql(expectedPayload);
// 		});

// 		it.skip('Should fail because not enough authority', async (index = '1') => {
// 			await init(index);
// 			const token = await auth(publisherAdmin);
// 			const response = await requester.get(`${requestPath}/admin`).set('Authorization', `Bearer ${token}`);
// 			expect(response).to.have.status(HttpStatus.OK);
// 		});

// 		it.skip('Should fail because the resource does not exist', async () => {
// 			const token = await auth(admin);
// 			const response = await requester.get(`${requestPath}/admin`).set('Authorization', `Bearer ${token}`);
// 			expect(response).to.have.status(HttpStatus.NOT_FOUND);
// 		});

// 		it.skip('Should fail because of incorrect paramaters', async (index = '1') => {
// 			await init(index, true);
// 			const token = await auth(admin);
// 			const response = await requester.get(`${requestPath}/foo`).set('Authorization', `Bearer ${token}`);
// 			expect(response).to.have.status(HttpStatus.NOT_FOUND);
// 		});

// 		async function init(index, getFixtures = false, getAuthProvider = false, getData = false) {
// 			mongoFixtures = await mongoFixturesFactory({rootPath: fixturesPath, useObjectId: true});
// 			RewireAPI.__Rewire__('MONGO_URI', await mongoFixtures.getConnectionString());
// 			RewireAPI.__Rewire__('PASSPORT_LOCAL_USERS', PASSPORT_LOCAL_USERS);
// 			const app = await startApp();

// 			requester = chai.request(app).keepOpen();
// 			let result = {};
// 			await mongoFixtures.populate(['read', index, 'dbContents.json']);
// 			if (getFixtures) {
// 				const expectedPayload = getFixture({components: ['read', index, 'expectedPayload.json'], reader: READERS.JSON});
// 				result.expectedPayload = expectedPayload;
// 			}

// 			if (getAuthProvider) {
// 				const authProvider = getFixture({components: ['read', index, 'local.json']});
// 				result.authProvider = JSON.parse(authProvider);
// 			}

// 			if (getData) {
// 				const metadata = getFixture({components: ['read', index, 'metadata.json']});
// 				const {descr, requestUrl, user, password} = JSON.parse(metadata);
// 				result = {...result, descr, requestUrl, user, password};
// 				console.log(result);
// 			}

// 			return result;
// 		}
// 	});

// 	describe('#create', () => {
// 		afterEach(async () => {
// 			fs.writeFileSync(formatUrl(PASSPORT_LOCAL_USERS), readAuthProvider, 'utf-8');
// 		});

// 		it.skip('Should succeed direct create User by Admin without SSOID', async (index = '0') => {
// 			await mongoFixtures.populate(['create', index, 'dbContents.json']);
// 			const {payload} = await init(index, true);
// 			const token = await auth(admin);
// 			const response = await requester.post(`${requestPath}`).set('Authorization', `Bearer ${token}`).send(payload);
// 			expect(response).to.have.status(HttpStatus.CREATED);
// 			const db = await mongoFixtures.dump();
// 			const {expectedDb} = await init(index, false);
// 			expect(formatDump(db)).to.eql(expectedDb);
// 		});

// 		it.skip('Should succeed create User by Admin using SSOID', async (index = '1') => {
// 			await mongoFixtures.populate(['create', index, 'dbContents.json']);
// 			const {payload} = await init(index, true);
// 			const token = await auth(admin);
// 			const response = await requester.post(`${requestPath}`).set('Authorization', `Bearer ${token}`).send(payload);
// 			expect(response).to.have.status(HttpStatus.CREATED);
// 			const db = await mongoFixtures.dump();
// 			const {expectedDb} = await init(index, false);
// 			expect(formatDump(db)).to.eql(expectedDb);
// 		});

// 		it.skip('Should fail because of unable to connect to db', async (index = '2') => {
// 			const {payload} = await init(index, true);
// 			const token = await auth(admin);
// 			const response = await requester.post(`${requestPath}`).set('Authorization', `Bearer ${token}`).send(payload);
// 			expect(response).to.have.status(HttpStatus.NOT_FOUND);
// 		});

// 		it.skip('Should fail because content is not provided', async (index = '3') => {
// 			await mongoFixtures.populate(['create', index, 'dbContents.json']);
// 			const token = await auth(admin);
// 			const response = await requester.post(`${requestPath}`).set('Authorization', `Bearer ${token}`).send();
// 			expect(response).to.have.status(HttpStatus.UNPROCESSABLE_ENTITY);
// 		});

// 		it.skip('Should fail because wrong SSOID', async (index = '4') => {
// 			await mongoFixtures.populate(['create', index, 'dbContents.json']);
// 			const {payload} = await init(index, true);
// 			const token = await auth(admin);
// 			const response = await requester.post(`${requestPath}`).set('Authorization', `Bearer ${token}`).send(payload);
// 			expect(response).to.have.status(HttpStatus.NOT_FOUND);
// 		});

// 		it.skip('Should succeed create User through userRequest using SSOID', async (index = '5_1') => {
// 			await mongoFixtures.populate(['create', index, 'dbContents.json']);
// 			const {payload} = await init(index, true);
// 			const token = await auth(admin);
// 			const response = await requester.post(`${requestPath}`).set('Authorization', `Bearer ${token}`).send(payload);
// 			expect(response).to.have.status(HttpStatus.CREATED);
// 			const db = await mongoFixtures.dump();
// 			const {expectedDb} = await init(index, false);
// 			expect(formatDump(db)).to.eql(expectedDb);
// 		});

// 		it.skip('Should succeed create User through userRequest without SSOID', async (index = '5_2') => {
// 			await mongoFixtures.populate(['create', index, 'dbContents.json']);
// 			const {payload} = await init(index, true);
// 			const token = await auth(admin);
// 			const response = await requester.post(`${requestPath}`).set('Authorization', `Bearer ${token}`).send(payload);
// 			expect(response).to.have.status(HttpStatus.CREATED);
// 			const db = await mongoFixtures.dump();
// 			const {expectedDb} = await init(index, false);
// 			expect(formatDump(db)).to.eql(expectedDb);
// 		});

// 		it.skip('Should fail because payload is invalid', async (index = '6') => {
// 			await mongoFixtures.populate(['create', index, 'dbContents.json']);
// 			const {payload} = await init(index, true);
// 			const token = await auth(admin);
// 			const response = await requester.post(`${requestPath}`).set('Authorization', `Bearer ${token}`).send(payload);
// 			expect(response).to.have.status(HttpStatus.UNPROCESSABLE_ENTITY);
// 		});

// 		async function init(index, getFixtures = false) {
// 			if (getFixtures) {
// 				return {
// 					payload: getFixture({components: ['create', index, 'payload.json'], reader: READERS.JSON})
// 				};
// 			}

// 			return {
// 				expectedDb: getFixture({components: ['create', index, 'dbExpected.json'], reader: READERS.JSON})
// 			};
// 		}
// 	});

// 	describe('#delete', () => {
// 		afterEach(async () => {
// 			fs.writeFileSync(formatUrl(PASSPORT_LOCAL_USERS), readAuthProvider, 'utf-8');
// 		});

// 		it.skip('Should succeed', async (index = '0') => {
// 			await mongoFixtures.populate(['delete', index, 'dbContents.json']);
// 			const token = await auth(admin);
// 			const response = await requester.delete(`${requestPath}/publisher`).set('Authorization', `Bearer ${token}`);
// 			expect(response).to.have.status(HttpStatus.OK);

// 			const db = await mongoFixtures.dump();
// 			const {expectedDb} = await init(index);
// 			expect(response).to.have.status(HttpStatus.OK);
// 			expect(formatDump(db)).to.eql(formatDump(expectedDb));
// 		});

// 		it.skip('Should fail, not enough authority', async (index = '0') => {
// 			await mongoFixtures.populate(['delete', index, 'dbContents.json']);
// 			const token = await auth(publisherAdmin);
// 			const response = await requester.delete(`${requestPath}/publisher`).set('Authorization', `Bearer ${token}`);
// 			expect(response).to.have.status(HttpStatus.FORBIDDEN);
// 		});

// 		it.skip('Should fail not authenticated', async (index = '1') => {
// 			await mongoFixtures.populate(['delete', index, 'dbContents.json']);
// 			const response = await requester.delete(`${requestPath}/publisher`);
// 			expect(response).to.have.status(HttpStatus.UNAUTHORIZED);
// 		});

// 		it.skip('Should fail because of wrong parameters', async (index = '1') => {
// 			await mongoFixtures.populate(['delete', index, 'dbContents.json']);
// 			const token = await auth(publisherAdmin);
// 			const response = await requester.delete(`${requestPath}`).set('Authorization', `Bearer ${token}`);
// 			expect(response).to.have.status(HttpStatus.NOT_FOUND);
// 		});

// 		async function init(index) {
// 			return {
// 				expectedDb: getFixture({components: ['delete', index, 'dbExpected.json'], reader: READERS.JSON})
// 			};
// 		}
// 	});

// 	describe('#update', () => {
// 		/* UÅDATE FUNCTION ARE NOT READY YET */
// 		it.skip('Should succeed', async (index = '0') => {
// 			await mongoFixtures.populate(['update', index, 'dbContents.json']);
// 			const {payload} = await init(index, true);
// 			const token = await auth(system);
// 			const response = await requester.put(`${requestPath}/5cd90e696a1e930789dfaa51`).set('Authorization', `Bearer ${token}`).send(payload);
// 			expect(response).to.have.status(HttpStatus.OK);

// 			const db = await mongoFixtures.dump();
// 			console.log(db);
// 			const {expectedDb} = await init(index, false);
// 			expect(formatDump(db)).to.eql(formatDump(expectedDb));
// 		});

// 		it.skip('Should fail because of wrong parameter', async (index = '1') => {
// 			await mongoFixtures.populate(['update', index, 'dbContents.json']);
// 			const {payload} = await init(index, true);
// 			const response = await requester.put(`${requestPath}/fooo`).set('content-type', 'application/json').send(payload);
// 			expect(response).to.have.status(HttpStatus.UNPROCESSABLE_ENTITY);
// 		});

// 		it.skip('Should fail because input was not provided', async (index = '1') => {
// 			await mongoFixtures.populate(['update', index, 'dbContents.json']);
// 			const response = await requester.put(`${requestPath}/5cd90e696a1e930789dfaa48`).set('content-type', 'application/json').send();
// 			expect(response).to.have.status(HttpStatus.UNPROCESSABLE_ENTITY);
// 		});

// 		async function init(index, getFixtures = false) {
// 			if (getFixtures) {
// 				return {
// 					payload: getFixture({components: ['update', index, 'payload.json'], reader: READERS.JSON})
// 				};
// 			}

// 			return {
// 				expectedDb: getFixture({components: ['update', index, 'dbExpected.json'], reader: READERS.JSON})
// 			};
// 		}
// 	});

// 	function formatDump(dump) {
// 		dump.userMetadata.forEach(doc =>
// 			Object.values(doc).forEach(field => Object.keys(field).filter(item =>
// 				item === 'timestamp' || item === 'user'
// 			).forEach(i => delete doc.lastUpdated[i]))
// 		);
// 		return dump;
// 	}
// });

import testSuiteFactory from './testUtils';

describe('app', () => {
	const generateTestSuite = testSuiteFactory({
		rootPath: [__dirname, '..', '..', 'test-fixtures']
	});

	describe('users', () => {
		describe('#read', generateTestSuite('users', 'read'));
		describe('#create', generateTestSuite('users', 'create'));
		describe('#changePwd', generateTestSuite('users', 'changePwd'));
		describe('#query', generateTestSuite('users', 'query'));
		describe('#delete', generateTestSuite('users', 'delete'));
		describe('#update', generateTestSuite('users', 'update'));
	});
});
