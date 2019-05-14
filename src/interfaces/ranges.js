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
		const result = await graphql(
			schema,
			`
				mutation(
					$prefix: String
					$language: String
					$rangeStart: Int
					$rangeEnd: Int
					$publisher: String
					$active: Boolean
					$reservedCount: Int
					$lastUpdated: LastUpdatedInput
				) {
					createISBN(
						prefix: $prefix
						language: $language
						rangeStart: $rangeStart
						rangeEnd: $rangeEnd
						publisher: $publisher
						active: $active
						reservedCount: $reservedCount
						lastUpdated: $lastUpdated
					) {
						language
					}
				}
			`,
			{db, isbnData}
		);
		if (result.data.createISBN === null) {
			throw new ApiError(HttpStatus.BAD_REQUEST);
		}

		return result;
	}

	async function readIsbn(db, id) {
		const result = await graphql(
			schema,
			`
				{
					ISBN {
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
						}
					}
				}
			`,
			{db, id}
		);
		if (result.data.ISBN === null) {
			throw new ApiError(HttpStatus.NOT_FOUND);
		}

		return result;
	}

	async function updateIsbn(db, id, data) {
		const result = await graphql(
			schema,
			`
				mutation(
					$prefix: String
					$language: String
					$rangeStart: Int
					$rangeEnd: Int
					$publisher: String
					$active: Boolean
					$reservedCount: Int
				) {
					updateISBN(
						prefix: $prefix
						language: $language
						rangeStart: $rangeStart
						rangeEnd: $rangeEnd
						publisher: $publisher
						active: $active
						reservedCount: $reservedCount
					) {
						prefix
						language
						rangeStart
						rangeEnd
					}
				}
			`,
			{db, id, data}
		);
		return result;
	}

	async function queryIsbn(db) {
		const result = await graphql(
			schema,
			`
				{
					ISBNs {
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
			`,
			db
		);
		return result;
	}

	async function createIsmn(db, data) {
		const result = await graphql(
			schema,
			`
				mutation(
					$prefix: String
					$rangeStart: Int
					$rangeEnd: Int
					$publisher: String
					$active: Boolean
					$reservedCount: Int
					$lastUpdated: LastUpdatedInput
				) {
					createISMN(
						prefix: $prefix
						rangeStart: $rangeStart
						rangeEnd: $rangeEnd
						publisher: $publisher
						active: $active
						reservedCount: $reservedCount
						lastUpdated: $lastUpdated
					) {
						prefix
					}
				}
			`,
			{db, data}
		);
		return result;
	}

	async function readIsmn(db, id) {
		const result = await graphql(
			schema,
			`
				{
					ISMN {
						_id
						prefix
						rangeStart
						rangeEnd
						publisher
						active
						reservedCount
						lastUpdated {
                            timestamp,
                            user
						}
					}
				}
			`,
			{db, id}
		);
		return result;
	}

	async function updateIsmn(db, id, data) {
		const result = await graphql(
			schema,
			`
				mutation(
					$prefix: String
					$rangeStart: Int
					$rangeEnd: Int
					$publisher: String
					$active: Boolean
					$reservedCount: Int
				) {
					updateISMN(
						prefix: $prefix
						rangeStart: $rangeStart
						rangeEnd: $rangeEnd
						publisher: $publisher
						active: $active
						reservedCount: $reservedCount
					) {
						prefix
						rangeStart
						rangeEnd
					}
				}
			`,
			{db, id, data}
		);
		return result;
	}

	async function queryIsmn(db) {
		const result = await graphql(
			schema,
			`
				{
					ISMNs {
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
			`,
			db
		);
		return result;
	}

	async function createIssn(db, data) {
		const result = await graphql(
			schema,
			`
				mutation(
					$rangeStart: Int
					$rangeEnd: Int
					$active: Boolean
					$reservedCount: Int
				) {
					createISSN(
						rangeStart: $rangeStart
						rangeEnd: $rangeEnd
						active: $active
						reservedCount: $reservedCount
					) {
						rangeStart
					}
				}
			`,
			{db, data}
		);
		return result;
	}

	async function readIssn(db, id) {
		const result = await graphql(
			schema,
			`
				{
					ISSN {
						_id
						rangeStart
						rangeEnd
						active
						reservedCount
						lastUpdated {
                            timestamp,
                            user
						}
					}
				}
			`,
			{db, id}
		);
		return result;
	}

	async function updateIssn(db, id, data) {
		const result = await graphql(
			schema,
			`
				mutation(
					$rangeStart: Int
					$rangeEnd: Int
					$active: Boolean
					$reservedCount: Int
				) {
					updateISSN(
						rangeStart: $rangeStart
						rangeEnd: $rangeEnd
						active: $active
						reservedCount: $reservedCount
					) {
						rangeStart
						rangeEnd
					}
				}
			`,
			{db, id, data}
		);
		return result;
	}

	async function queryIssn(db) {
		const result = await graphql(
			schema,
			`
				{
					ISSNs {
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
			`,
			db
		);
		return result;
	}
}
