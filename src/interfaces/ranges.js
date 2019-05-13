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
		return graphql(
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
	}

	async function readIsbn(db, id) {
		return graphql(
			schema,
			`
				{
					ISBN {
						id
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
	}

	async function updateIsbn(db, id, data) {
		return graphql(
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
	}

	async function queryIsbn(db) {
		return graphql(
			schema,
			`
				{
					ISBNs {
						id
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
	}

	async function createIsmn(db, data) {
		return graphql(
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
	}

	async function readIsmn(db, id) {
		return graphql(
			schema,
			`
				{
					ISMN {
						id
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
	}

	async function updateIsmn(db, id, data) {
		return graphql(
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
	}

	async function queryIsmn(db) {
		return graphql(
			schema,
			`
				{
					ISMNs {
						id
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
	}

	async function createIssn(db, data) {
		return graphql(
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
	}

	async function readIssn(db, id) {
		return graphql(
			schema,
			`
				{
					ISSN {
						id
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
	}

	async function updateIssn(db, id, data) {
		return graphql(
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
	}

	async function queryIssn(db) {
		return graphql(
			schema,
			`
				{
					ISSNs {
						id
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
	}
}
