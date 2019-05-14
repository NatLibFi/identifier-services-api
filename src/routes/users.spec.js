
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

describe('routes/users', () => {
	let requester;
	let mongoFixtures;

	const API_URL = `http://localhost:${HTTP_PORT}`;
	const fixturesPath = [__dirname, '..', '..', 'test-fixtures', 'users'];
	const requestPath = '/users';
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

	describe('#read', () => {
		it.skip('Should succeed', async (index = '0') => {
			const {expectedPayload} = await init(index, true);
			const response = await requester.get(`${requestPath}/5cd90e696a1e930789dfaa48`);
			expect(response).to.have.status(HttpStatus.OK);
			expect(response.body).to.eql(expectedPayload); // Time-stamp will never match
		});

		it.skip('Should fail because the resource does not exist', async () => {
			const response = await requester.get(`${requestPath}/5cd90e696a1e930789dfaa48`);
			expect(response).to.have.status(HttpStatus.NOT_FOUND);
		});

		async function init(index, getFixtures = false) {
			await mongoFixtures.populate(['read', index, 'dbContents.json']);
			if (getFixtures) {
				return {
					expectedPayload: getFixture({components: ['read', index, 'expectedPayload.json'], reader: READERS.JSON})
				};
			}
		}
	});

	describe('#create', () => {
		it.skip('Should succeed', async (index = '0') => {
			await mongoFixtures.populate(['create', index, 'dbContents.json']);

			const {payload} = await init(index, true);
			const response = await requester.post(`${requestPath}`).set('content-type', 'application/json').send(payload);
			expect(response).to.have.status(HttpStatus.OK);

			const db = await mongoFixtures.dump();
			const {expectedDb} = await init(index, false);
			expect(formatDump(db)).to.eql(expectedDb);
		});

		it.skip('Should not succeed because content is not provided', async (index = '1') => {
			const {payload} = await init(index, true);
			const response = await requester.post(`${requestPath}`).set('content-type', 'application/json').send(payload);
			expect(response).to.have.status(HttpStatus.BAD_REQUEST);
		});

		it('Should not succeed because of invalid syntax', async (index = '2') => {
			const {payload} = await init(index, true);
			const response = await requester.post(`${requestPath}`).set('content-type', 'application/json').send(payload);
			expect(response).to.have.status(HttpStatus.UNPROCESSABLE_ENTITY);
		});

		async function init(index, getFixtures = false) {
			if (getFixtures) {
				return {
					payload: getFixture({components: ['create', index, 'payload.json'], reader: READERS.JSON})
				};
			}

			return {
				expectedDb: getFixture({components: ['create', index, 'dbExpected.json'], reader: READERS.JSON})
			};
		}
	});

	// Describe('#delete', () => {
	// 	it.skip('Should succeed', async (index = '0') => {
	// 		await mongoFixtures.populate(['delete', index, 'dbContents.json']);
	// 		const response = await requester.delete(`${requestPath}/5cd90e696a1e930789dfaa48`);
	// 		await mongoFixtures.populate(['delete', index, 'dbExpected.json']);
	// 		const res = await requester.get(`${requestPath}/5cd90e696a1e930789dfaa48`);
	// 		expect(response).to.have.status(HttpStatus.OK);
	// 		expect(res.body.data.userMetadata).to.eql(null);
	// 	});

	// 	it.skip('Should not succeed because of wrong parameters', async (index = '1') => {
	// 		await mongoFixtures.populate(['delete', index, 'dbContents.json']);
	// 		const query = await requester.post(`${requestPath}/query`);
	// 		const response = await requester.delete(`${requestPath}/foo`);
	// 		const newQuery = await requester.post(`${requestPath}/query`);
	// 		expect(response).to.have.status(HttpStatus.OK);
	// 		expect(query.body.data).to.eql(newQuery.body.data);
	// 	});
	// });

	// describe('#update', () => {
	// 	it.skip('Should succeed', async (index = '0') => {
	// 		await mongoFixtures.populate(['update', index, 'dbContents.json']);
	// 		const {payload} = await init(index, true);
	// 		const response = await requester.put(`${requestPath}/5cd90e696a1e930789dfaa48`).set('content-type', 'application/json').send(payload);
	// 		console.log('reqponse', response.body);

	// 		await mongoFixtures.populate(['update', index, 'dbExpected.json']);
	// 		const query = await requester.get(`${requestPath}/5cd90e696a1e930789dfaa48`);
	// 		console.log('query', query.body);
	// 	});

	// 	async function init(index, getFixtures = false) {
	// 		if (getFixtures) {
	// 			return {
	// 				payload: getFixture({components: ['update', index, 'payload.json'], reader: READERS.JSON})
	// 			};
	// 		}
	// 	}
	// });

	function formatDump(dump) {
		dump.userMetadata.forEach(doc =>
			Object.values(doc).forEach(field => Object.keys(field).filter(item =>
				item === 'timestamp'
			).forEach(i => delete doc.lastUpdated[i]))
		);
		console.log(dump.userMetadata);
		return dump;
	}
});

