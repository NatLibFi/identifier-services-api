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
import {MongoClient} from 'mongodb';
import {MONGO_URI} from '../config';
import {graphql} from 'graphql';
import schema from '../graphql';

export default function() {
	const client = new MongoClient(MONGO_URI, {useNewUrlParser: true});

	let db;
	client.connect(err => {
		const dbName = 'IdentifierServices';
		db = client.db(dbName);
		console.log(err);
	});
	return {create, read, update, remove, query, newPublication};

	async function query() {
		return graphql(
			schema,
			`
				{
					Publishers {
						id
						lastUpdated {
							timestamp
							user
						}
						name
						language
						metadataDelivery
						primaryContact
						email
						phone
						website
						aliases
						notes
						activity {
							active
							yearInactivated
						}
						streetAddress {
							address
							city
							zip
						}
					}
				}
			`,
			db
		);
	}

	async function read(id) {
		return graphql(
			schema,
			`
				{
					Publisher {
						id
						lastUpdated {
							timestamp
							user
						}
						name
						language
						metadataDelivery
						primaryContact
						email
						phone
						website
						aliases
						notes
						activity {
							active
							yearInactivated
						}
						streetAddress {
							address
							city
							zip
						}
					}
				}
			`,
			{db, id}
		);
	}

	async function create(user) {
		return graphql(
			schema,
			`
				mutation(
					$id: String
					$timestamp: String
					$user: String
					$name: String
					$language: String
					$metadataDelivery: String
					$primaryContact: String
					$email: String
					$phone: String
					$website: String
					$aliases: String
					$notes: String
					$active: Boolean
					$yearInactivated: Int
					$address: String
					$city: String
					$zip: String
				) {
					createPublisher(
						id: $id
						timestamp: $timestamp
						user: $user
						name: $name
						language: $language
						metadataDelivery: $metadataDelivery
						primaryContact: $primaryContact
						email: $email
						phone: $phone
						website: $website
						aliases: $aliases
						notes: $notes
						active: $active
						yearInactivated: $yearInactivated
						address: $address
						city: $city
						zip: $zip
					) {
						id
						name
					}
				}
			`,
			{db, user}
		);
	}

	async function update(id, publisher) {
		return graphql(
			schema,
			`
				mutation(
					$id: String
					$timestamp: String
					$user: String
					$name: String
					$language: String
					$metadataDelivery: String
					$primaryContact: String
					$email: String
					$phone: String
					$website: String
					$aliases: String
					$notes: String
					$active: Boolean
					$yearInactivated: Int
					$address: String
					$city: String
					$zip: String
				) {
					updatePublisher(
						id: $id
						timestamp: $timestamp
						user: $user
						name: $name
						language: $language
						metadataDelivery: $metadataDelivery
						primaryContact: $primaryContact
						email: $email
						phone: $phone
						website: $website
						aliases: $aliases
						notes: $notes
						active: $active
						yearInactivated: $yearInactivated
						address: $address
						city: $city
						zip: $zip
					) {
						id
						name
					}
				}
			`,
			{db, id, publisher}
		);
	}

	async function remove(id) {
		console.log('remove', id);
		return graphql(
			schema,
			`
				mutation($id: String){
					deletePublisher(
						id: $id
					){
						id
					}
				}
			`,
			{db, id}
		);
	}

	async function newPublication({user}) {
		return user;
	}

	// async function getPublisher(id) {
	// 	const profile = await Mongoose.models.Publisher.findOne({id});

	// 	if (publisher) {
	// 		 (publisher)
	// 	}
	// }
}
