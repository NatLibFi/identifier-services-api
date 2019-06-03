/* eslint-disable max-nested-callbacks */

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
import HttpStatus from 'http-status';
import {HTTP_PORT} from '../config';
import fixtureFactory, {READERS} from '@natlibfi/fixura';
import mongoFixturesFactory from '@natlibfi/fixura-mongo';
import startApp, {__RewireAPI__ as RewireAPI} from '../app'; // eslint-disable-line import/named
import chai, {expect} from 'chai';
import chaiHttp from 'chai-http';

chai.use(chaiHttp);

describe('routes/ranges', () => {
	let requester;
	let mongoFixtures;

	const API_URL = `http://localhost:${HTTP_PORT}`;
	const fixturesPath = [__dirname, '..', '..', 'test-fixtures', 'ranges'];
	const requestPath = '/ranges';
	const {getFixture} = fixtureFactory({root: fixturesPath});

	beforeEach(async () => {
		mongoFixtures = await mongoFixturesFactory({rootPath: fixturesPath, useObjectId: true});
		RewireAPI.__Rewire__('MONGO_URI', await mongoFixtures.getConnectionString());
		RewireAPI.__Rewire__('API_URL', API_URL);

		const app = await startApp();

		requester = chai.request(app).keepOpen();
	});

	afterEach(async () => {
		await requester.close();
		await mongoFixtures.close();
		RewireAPI.__ResetDependency__('MONGO_URI');
		RewireAPI.__ResetDependency__('API_URL');
	});

	// ************************Testing for ISBN starts **************************

	describe('#read ISBN', () => {
		it('Should succeed', async (index = '0') => {
			const {expectedPayload} = await init(index, true);
			const response = await requester.get(`${requestPath}/isbn/5cd90b2c89d0546340068667`);
			expect(response).to.have.status(HttpStatus.OK);
			expect(response.body).to.eql(expectedPayload);
		});

		it('Should fail because the resource does not exist', async () => {
			const response = await requester.get(`${requestPath}/isbn/5cd90b2c89d0546340068667`);
			expect(response).to.have.status(HttpStatus.NOT_FOUND);
		});

		async function init(index, getFixtures = false) {
			await mongoFixtures.populate(['isbn/read', index, 'dbContents.json']);
			if (getFixtures) {
				return {
					expectedPayload: getFixture({components: ['isbn/read', index, 'expectedPayload.json'], reader: READERS.JSON})
				};
			}
		}
	});

	describe('#create ISBN', () => {
		it('Should create a new isbn range', async (index = '0') => {
			const {payload} = await init(index, true);
			const response = await requester.post(`${requestPath}/isbn`).set('content-type', 'application/json').send(payload);
			expect(response).to.have.status(HttpStatus.OK);
			const db = await mongoFixtures.dump();
			const {expectedDb} = await init(index, false);
			expect(formatDump(db)).to.eql(expectedDb);
		});

		it('Should fail to create because content is not provided', async (index = '1') => {
			const {payload} = await init(index, true);
			const response = await requester.post(`${requestPath}/isbn`).set('content-type', 'application/json').send(payload);
			expect(response).to.have.status(HttpStatus.BAD_REQUEST);
		});

		it('Should fail to create because of invalid syntax', async (index = '2') => {
			const {payload} = await (index, true);
			const response = await requester.post(`${requestPath}/isbn`).set('content-type', 'application/json').send(payload);
			expect(response).to.have.status(HttpStatus.BAD_REQUEST);
		});

		async function init(index, getFixtures = false) {
			await mongoFixtures.populate(['isbn/create', index, 'dbContents.json']);
			if (getFixtures) {
				return {
					payload: getFixture({components: ['isbn/create', index, 'payload.json'], reader: READERS.JSON})
				};
			}

			return {
				expectedDb: getFixture({components: ['isbn/create', index, 'dbExpected.json'], reader: READERS.JSON})
			};
		}

		function formatDump(dump) {
			dump.IdentifierRangesISBN.forEach(doc =>
				Object.values(doc).forEach(field => Object.keys(field).filter(item =>
					item === 'timestamp'
				).forEach(i => delete doc.lastUpdated[i]))
			);
			return dump;
		}
	});

	describe('#update ISBN', () => {
		it('Should update ISBN', async (index = '0') => {
			const {payload} = await init(index, true);
			const response = await requester.put(`${requestPath}/isbn/5cd90b2c89d0546340068667`).set('content-type', 'application/json').send(payload);
			expect(response).to.have.status(HttpStatus.OK);
			const db = await mongoFixtures.dump();
			const {expectedDb} = await init(index, false);
			expect(formatDump(db)).to.eql(expectedDb);
		});

		async function init(index, getFixtures = false) {
			await mongoFixtures.populate(['isbn/update', index, 'dbContents.json']);
			if (getFixtures) {
				return {
					payload: getFixture({components: ['isbn/update', index, 'payload.json'], reader: READERS.JSON})
				};
			}

			return {
				expectedDb: getFixture({components: ['isbn/update', index, 'dbExpected.json'], reader: READERS.JSON})
			};
		}

		function formatDump(dump) {
			dump.IdentifierRangesISBN.forEach(doc =>
				Object.values(doc).forEach(field => Object.keys(field).filter(item =>
					item === 'timestamp'
				).forEach(i => delete doc.lastUpdated[i]))
			);
			return dump;
		}
	});

	// ************************Testing for ISMN starts **************************

	describe('#read ISMN', () => {
		it('Should succeed', async (index = '0') => {
			const {expectedPayload} = await init(index, true);
			const response = await requester.get(`${requestPath}/ismn/5cd90b2c89d0546340068667`);
			expect(response).to.have.status(HttpStatus.OK);
			expect(response.body).to.eql(expectedPayload);
		});

		it('Should fail because the resource does not exist', async () => {
			const response = await requester.get(`${requestPath}/ismn/5cd90b2c89d0546340068667`);
			expect(response).to.have.status(HttpStatus.NOT_FOUND);
		});

		async function init(index, getFixtures = false) {
			await mongoFixtures.populate(['ismn/read', index, 'dbContents.json']);
			if (getFixtures) {
				return {
					expectedPayload: getFixture({components: ['ismn/read', index, 'expectedPayload.json'], reader: READERS.JSON})
				};
			}
		}
	});

	describe('#create ISMN', () => {
		it('Should create a new ismn range', async (index = '0') => {
			const {payload} = await init(index, true);
			const response = await requester.post(`${requestPath}/ismn`).set('content-type', 'application/json').send(payload);
			expect(response).to.have.status(HttpStatus.OK);
			const db = await mongoFixtures.dump();
			const {expectedDb} = await init(index, false);
			expect(formatDump(db)).to.eql(expectedDb);
		});

		it('Should fail to create because content is not provided', async (index = '1') => {
			const {payload} = await init(index, true);
			const response = await requester.post(`${requestPath}/ismn`).set('content-type', 'application/json').send(payload);
			expect(response).to.have.status(HttpStatus.BAD_REQUEST);
		});

		it('Should fail to create because of invalid syntax', async (index = '2') => {
			const {payload} = await init(index, true);
			const response = await requester.post(`${requestPath}/isbn`).set('content-type', 'application/json').send(payload);
			expect(response).to.have.status(HttpStatus.BAD_REQUEST);
		});

		async function init(index, getFixtures = false) {
			await mongoFixtures.populate(['ismn/create', index, 'dbContents.json']);
			if (getFixtures) {
				return {
					payload: getFixture({components: ['ismn/create', index, 'payload.json'], reader: READERS.JSON})
				};
			}

			return {
				expectedDb: getFixture({components: ['ismn/create', index, 'dbExpected.json'], reader: READERS.JSON})
			};
		}

		function formatDump(dump) {
			dump.IdentifierRangesISMN.forEach(doc =>
				Object.values(doc).forEach(field => Object.keys(field).filter(item =>
					item === 'timestamp'
				).forEach(i => delete doc.lastUpdated[i]))
			);
			return dump;
		}
	});

	describe('#update ISMN', () => {
		it('Should update ISMN', async (index = '0') => {
			const {payload} = await init(index, true);
			const response = await requester.put(`${requestPath}/ismn/5cd90b2c89d0546340068668`).set('content-type', 'application/json').send(payload);
			expect(response).to.have.status(HttpStatus.OK);
			const db = await mongoFixtures.dump();
			const {expectedDb} = await init(index, false);
			expect(formatDump(db)).to.eql(expectedDb);
		});

		async function init(index, getFixtures = false) {
			await mongoFixtures.populate(['ismn/update', index, 'dbContents.json']);
			if (getFixtures) {
				return {
					payload: getFixture({components: ['ismn/update', index, 'payload.json'], reader: READERS.JSON})
				};
			}

			return {
				expectedDb: getFixture({components: ['ismn/update', index, 'dbExpected.json'], reader: READERS.JSON})
			};
		}

		function formatDump(dump) {
			dump.IdentifierRangesISMN.forEach(doc =>
				Object.values(doc).forEach(field => Object.keys(field).filter(item =>
					item === 'timestamp'
				).forEach(i => delete doc.lastUpdated[i]))
			);
			return dump;
		}
	});

	// ************************Testing for ISSN starts **************************

	describe('#read ISSN', () => {
		it('Should succeed', async (index = '0') => {
			const {expectedPayload} = await init(index, true);
			const response = await requester.get(`${requestPath}/issn/5cd90b2c89d0546340068667`);
			expect(response).to.have.status(HttpStatus.OK);
			expect(response.body).to.eql(expectedPayload);
		});

		it('Should fail because the resource does not exist', async () => {
			const response = await requester.get(`${requestPath}/issn/5cd90b2c89d0546340068667`);
			expect(response).to.have.status(HttpStatus.NOT_FOUND);
		});

		async function init(index, getFixtures = false) {
			await mongoFixtures.populate(['issn/read', index, 'dbContents.json']);
			if (getFixtures) {
				return {
					expectedPayload: getFixture({components: ['issn/read', index, 'expectedPayload.json'], reader: READERS.JSON})
				};
			}
		}
	});

	describe('#create ISSN', () => {
		it('Should create a new issn range', async (index = '0') => {
			const {payload} = await init(index, true);
			const response = await requester.post(`${requestPath}/issn`).set('content-type', 'application/json').send(payload);
			expect(response).to.have.status(HttpStatus.OK);
			const db = await mongoFixtures.dump();
			const {expectedDb} = await init(index, false);
			expect(formatDump(db)).to.eql(expectedDb);
		});

		it('Should fail to create because content is not provided', async (index = '1') => {
			const {payload} = await init(index, true);
			const response = await requester.post(`${requestPath}/issn`).set('content-type', 'application/json').send(payload);
			expect(response).to.have.status(HttpStatus.BAD_REQUEST);
		});

		it('Should fail to create because of invalid syntax', async (index = '2') => {
			const {payload} = await init(index, true);
			const response = await requester.post(`${requestPath}/isbn`).set('content-type', 'application/json').send(payload);
			expect(response).to.have.status(HttpStatus.BAD_REQUEST);
		});

		async function init(index, getFixtures = false) {
			await mongoFixtures.populate(['issn/create', index, 'dbContents.json']);
			if (getFixtures) {
				return {
					payload: getFixture({components: ['issn/create', index, 'payload.json'], reader: READERS.JSON})
				};
			}

			return {
				expectedDb: getFixture({components: ['issn/create', index, 'dbExpected.json'], reader: READERS.JSON})
			};
		}

		function formatDump(dump) {
			dump.IdentifierRangesISSN.forEach(doc =>
				Object.values(doc).forEach(field => Object.keys(field).filter(item =>
					item === 'timestamp'
				).forEach(i => delete doc.lastUpdated[i]))
			);
			return dump;
		}
	});

	describe('#update ISSN', () => {
		it('Should update ISSN', async (index = '0') => {
			const {payload} = await init(index, true);
			const response = await requester.put(`${requestPath}/issn/5cd90b2c89d0546340068668`).set('content-type', 'application/json').send(payload);
			expect(response).to.have.status(HttpStatus.OK);
			const db = await mongoFixtures.dump();
			const {expectedDb} = await init(index, false);
			expect(formatDump(db)).to.eql(expectedDb);
		});

		async function init(index, getFixtures = false) {
			await mongoFixtures.populate(['issn/update', index, 'dbContents.json']);
			if (getFixtures) {
				return {
					payload: getFixture({components: ['issn/update', index, 'payload.json'], reader: READERS.JSON})
				};
			}

			return {
				expectedDb: getFixture({components: ['issn/update', index, 'dbExpected.json'], reader: READERS.JSON})
			};
		}

		function formatDump(dump) {
			dump.IdentifierRangesISSN.forEach(doc =>
				Object.values(doc).forEach(field => Object.keys(field).filter(item =>
					item === 'timestamp'
				).forEach(i => delete doc.lastUpdated[i]))
			);
			return dump;
		}
	});
});

