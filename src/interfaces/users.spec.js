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
import {expect} from 'chai';
import fixtureFactory, {READERS} from '@natlibfi/fixura';
import mongoFixtureFactory from '@natlibfi/fixura-mongo';
import Mongoose from 'mongoose';
import {usersFactory} from '.';

describe('interfaces/users', async () => {
	let mongoFixtures;
	const {getFixture} = fixtureFactory({
		root: [__dirname, '..', '..', 'test-fixtures', 'users'],
		reader: READERS.JSON
	});

	beforeEach(async () => {
		mongoFixtures = await mongoFixtureFactory();
		await Mongoose.connect(await mongoFixtures.getConnectionString(), {
			useNewURLParser: true
		});
	});

	afterEach(async () => {
		await Mongoose.disconnect();
		await mongoFixtures.close();
	});

	describe('#create', () => {
		it('Should create a new user', async (index = '0') => {
			const dbContents = getFixture(['create', index, 'dbContents.json']);
			const expectedDb = getFixture(['create', index, 'expectedDb.json']);
			const users = usersFactory({url: 'https://'});

			await mongoFixtures.populate(dbContents);

			await users.create({id: 'foo', preference: {}});
			const db = await mongoFixtures.dump();

			expect(db).to.eql(expectedDb);
		});
	});
});
