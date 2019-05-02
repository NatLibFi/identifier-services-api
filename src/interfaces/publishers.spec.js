/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * API microservice of Melinda record batch import system
 *
 * Copyright (C) 2018-2019 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of melinda-record-import-api
 *
 * melinda-record-import-api program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * melinda-record-import-api is distributed in the hope that it will be useful,
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

import {expect} from 'chai';
import Mongoose from 'mongoose';
import publishersFactory from './publishers';
import fixtureFactory, {READERS} from '@natlibfi/fixura';
import mongoFixturesFactory from '@natlibfi/fixura-mongo';

describe('interfaces/publishers', () => {
	let mongoFixtures;
	const {getFixture} = fixtureFactory({
		root: [__dirname, '..', '..', 'test-fixtures', 'publishers'],
		reader: READERS.JSON
	});

	beforeEach(async () => {
		mongoFixtures = await mongoFixturesFactory({
			gridFS: {bucketName: 'publishers'}
		});
		await Mongoose.connect(await mongoFixtures.getConnectionString(), {
			useNewUrlParser: true
		});
	});

	afterEach(async () => {
		await Mongoose.disconnect();
		await mongoFixtures.close();
	});

	describe('#read', () => {
		let dbContents, publishers, publisher, expectedResults;

		async function defineVariables(index) {
			dbContents = getFixture(['read', index, 'dbContents.json']);
			publisher = getFixture(['read', index, 'publisher.json']);
			publishers = publishersFactory({url: 'https://'});
			expectedResults = getFixture(['read', index, 'expectedResults.json']);

			await mongoFixtures.populate(dbContents);
		}

		it('Should succed', async (index = '0') => {
			defineVariables(index);

			const result = await publishers.read({id: 'foo', publisher: publisher});
			expect(formatPublisherMetadata(result)).to.eql(expectedResults);
		});

		it('Should fail if the publisher does not exit', async (index = '1') => {
			defineVariables(index);
			try {
				await publishers.read({id: 'foo'});
				throw new Error('Should not succeed');
			} catch (err) {
				// expect(err).to.be.instanceOf(ApiError);
				// expect(err.status).to.equal(HttpStatus.NOT_FOUND);
			}
		});
	});

	function formatPublisherMetadata(doc) {
		format(doc);
		return doc;

		function format(o) {
			Object.keys(o).forEach(key => {
				if (
					['_id', 'creationTime', 'modificationTime', 'creationTime'].includes(
						key
					)
				) {
					delete o[key];
				} else if (Array.isArray(o[key])) {
					o[key].filter(v => typeof v === 'object').forEach(format);
				} else if (typeof o[key] === 'object') {
					format(o[key]);
				}
			});
		}
	}
});
