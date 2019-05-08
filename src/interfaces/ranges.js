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
import {MongoClient} from 'mongodb';
import {MONGO_URI} from '../config';
import schema from '../graphql';

export default function() {
	const client = new MongoClient(MONGO_URI, {useNewUrlParser: true});

	let db;
	client.connect(err => {
		const dbName = 'IdentifierServices';
		db = client.db(dbName);
		console.log(err);
	});

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

	async function createIsbn(isbnData) {
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

	async function readIsbn() {
		return graphql();
	}
	async function updateIsbn() {
		return graphql();
	}
	async function queryIsbn() {
		return graphql();
	}
	async function createIsmn() {
		return graphql();
	}
	async function readIsmn() {
		return graphql();
	}
	async function updateIsmn() {
		return graphql();
	}
	async function queryIsmn() {
		return graphql();
	}
	async function createIssn() {
		return graphql();
	}
	async function readIssn() {
		return graphql();
	}
	async function updateIssn() {
		return graphql();
	}
	async function queryIssn() {
		return graphql();
	}
}
