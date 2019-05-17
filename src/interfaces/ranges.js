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
import {graphql} from 'graphql';
import schema from '../graphql';
import HttpStatus from 'http-status';
import {ApiError} from '@natlibfi/identifier-services-commons';
import resolvers from '../graphql/resolvers';

export default function () {
	return {
		createIsbn,
		readIsbn,
		updateIsbn,
		queryIsbn,
		createIsmn,
		readIsmn,
		updateIsmn,
		queryIsmn,
		createIssn,
		readIssn,
		updateIssn,
		queryIssn
	};

	async function createIsbn(db, isbnData) {
		const query = `
			mutation($input: ISBNInput){
				createISBN(input: $input) {
					prefix
					language
					rangeStart
					rangeEnd
				}
			}
		`;
		const root = {
			createISBN: resolvers.createISBN
		};
		try {
			const result = await graphql(schema, query, root, db, {input: isbnData});
			return result;
		} catch (err) {
			return err;
		}
	}

	async function readIsbn(db, id) {
		const query = `
			{
				ISBN{
					_id
					prefix
					language
					rangeStart
					rangeEnd
					publisher
					active
					reservedCount
					lastUpdated {
						timestamp
						user
					}
				}
			}
		`;
		const root = {
			ISBN: resolvers.ISBN
		};
		try {
			const result = await graphql(schema, query, root, {id, db});
			return result;
		} catch (err) {
			return err;
		}
	}

	async function updateIsbn(db, id, data) {
		const query = `
			mutation($input: ISBNInput){
				updateISBN(input: $input) {
					prefix
					language
					rangeStart
					rangeEnd
				}
			}
		`;
		const root = {
			updateISBN: resolvers.updateISBN
		};
		try {
			const result = await graphql(schema, query, root, {db, id}, {input: data});
			return result;
		} catch (err) {
			return err;
		}
	}

	async function queryIsbn(db) {
		const query = `
			{
				ISBNs{
					_id
					prefix
					language
					rangeStart
					rangeEnd
					publisher
					active
					reservedCount
					lastUpdated {
						timestamp
						user
					}
				}
			}
		`;
		const root = {
			ISBNs: resolvers.ISBNs
		};
		try {
			const result = await graphql(schema, query, root, db);
			return result;
		} catch (err) {
			return err;
		}
	}

	async function createIsmn(db, data) {
		const query = `
			mutation($input: ISMNInput){
				createISMN(input: $input) {
					prefix
					rangeStart
					rangeEnd
				}
			}
		`;
		const root = {
			createISMN: resolvers.createISMN
		};
		try {
			const result = await graphql(schema, query, root, db, {input: data});
			return result;
		} catch (err) {
			return err;
		}
	}

	async function readIsmn(db, id) {
		const query = `
			{
				ISMN{
					_id
					prefix
					rangeStart
					rangeEnd
					publisher
					active
					reservedCount
					lastUpdated {
						timestamp
						user
					}
				}
			}
		`;
		const root = {
			ISMN: resolvers.ISMN
		};
		try {
			const result = await graphql(schema, query, root, {id, db});
			return result;
		} catch (err) {
			return err;
		}
	}

	async function updateIsmn(db, id, data) {
		const query = `
			mutation($input: ISMNInput){
				updateISMN(input: $input) {
					prefix
					rangeStart
					rangeEnd
				}
			}
		`;
		const root = {
			updateISMN: resolvers.updateISMN
		};
		try {
			const result = await graphql(schema, query, root, {db, id}, {input: data});
			return result;
		} catch (err) {
			return err;
		}
	}

	async function queryIsmn(db) {
		const query = `
			{
				ISMNs{
					_id
					prefix
					rangeStart
					rangeEnd
					publisher
					active
					reservedCount
					lastUpdated {
						timestamp
						user
					}
				}
			}
		`;
		const root = {
			ISMNs: resolvers.ISMNs
		};
		try {
			const result = await graphql(schema, query, root, db);
			return result;
		} catch (err) {
			return err;
		}
	}

	async function createIssn(db, data) {
		const query = `
			mutation($input: ISSNInput){
				createISSN(input: $input) {
					rangeStart
					rangeEnd
					active
					reservedCount
				}
			}
		`;
		const root = {
			createISSN: resolvers.createISSN
		};
		try {
			const result = await graphql(schema, query, root, db, {input: data});
			return result;
		} catch (err) {
			return err;
		}
	}

	async function readIssn(db, id) {
		const query = `
			{
				ISSN{
					_id
					rangeStart
					rangeEnd
					active
					reservedCount
					lastUpdated {
						timestamp
						user
					}
				}
			}
		`;
		const root = {
			ISSN: resolvers.ISSN
		};
		try {
			const result = await graphql(schema, query, root, {id, db});
			return result;
		} catch (err) {
			return err;
		}
	}

	async function updateIssn(db, id, data) {
		const query = `
			mutation($input: ISSNInput){
				updateISSN(input: $input) {
					rangeStart
					rangeEnd
					active
				}
			}
		`;
		const root = {
			updateISSN: resolvers.updateISSN
		};
		try {
			const result = await graphql(schema, query, root, {db, id}, {input: data});
			return result;
		} catch (err) {
			return err;
		}
	}

	async function queryIssn(db) {
		const query = `
			{
				ISSNs{
					_id
					rangeStart
					rangeEnd
					active
					reservedCount
					lastUpdated {
						timestamp
						user
					}
				}
			}
		`;
		const root = {
			ISSNs: resolvers.ISSNs
		};
		try {
			const result = await graphql(schema, query, root, db);
			return result;
		} catch (err) {
			return err;
		}
	}
}
