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
		create,
		read,
		update,
		remove,
		query,
		createRequests,
		readRequest,
		removeRequest,
		updateRequest,
		queryRequests
	};

	async function query(db) {
		return graphql(
			schema,
			`
				{
					Publishers {
						_id
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

	async function read(db, id) {
		const result = await graphql(
			schema,
			`
				{
					Publisher {
						_id
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
		console.log('--------', result);
		return result;
	}

	async function create(db, data) {
		const result = await graphql(
			schema,
			`
				mutation(
					$name: String
					$language: String
					$metadataDelivery: String
					$primaryContact: [String]
					$email: String
					$phone: String
					$website: String
					$aliases: [String]
					$notes: [String]
					$activity: ActivityInput
					$streetAddress: StreetAddressInput
				) {
					createPublisher(
						name: $name
						language: $language
						metadataDelivery: $metadataDelivery
						primaryContact: $primaryContact
						email: $email
						phone: $phone
						website: $website
						aliases: $aliases
						notes: $notes
						activity: $activity
						streetAddress: $streetAddress
					) {					
						name
						language						
					}
				}
			`,
			{db, data}
		);
		return result;
	}

	async function update(db, id, data) {
		return graphql(
			schema,
			`
				mutation(
					$name: String
					$language: String
					$metadataDelivery: String
					$primaryContact: [String]
					$email: String
					$phone: String
					$website: String
					$aliases: [String]
					$notes: [String]
					$activity: ActivityInput
					$streetAddress: StreetAddressInput
				) {
					updatePublisher(
						name: $name
						language: $language
						metadataDelivery: $metadataDelivery
						primaryContact: $primaryContact
						email: $email
						phone: $phone
						website: $website
						aliases: $aliases
						notes: $notes
						activity: $activity
						streetAddress: $streetAddress
					) {
						name
					}
				}
			`,
			{db, id, data}
		);
	}

	async function remove(db, id) {
		return graphql(
			schema,
			`
				mutation($_id: ID) {
					deletePublisher(_id: $_id) {
						_id
					}
				}
			`,
			{db, id}
		);
	}

	async function createRequests(db, data) {
		return graphql(
			schema,
			`
				mutation(
					$state: String
					$publisherId: String
					$publicationEstimate: Int
					$primaryContact: [PrimaryContactRequestInput]
					$name: String
					$language: String
					$metadataDelivery: String
					$email: String
					$phone: String
					$website: String
					$aliases: [String]
					$notes: [String]
					$activity: ActivityInput
					$streetAddress: StreetAddressInput
					$publication: ISBNISMNPublicationRequestInput
				) {
					createPublisherRequests(
						state: $state
						publisherId: $publisherId
						publicationEstimate: $publicationEstimate
						primaryContact: $primaryContact
						name: $name
						language: $language
						metadataDelivery: $metadataDelivery
						email: $email
						phone: $phone
						website: $website
						aliases: $aliases
						notes: $notes
						activity: $activity
						streetAddress: $streetAddress
						publication: $publication
					) {
						name
						lastUpdated {
							timestamp
							user
						}
					}
				}
			`,
			{db, data}
		);
	}

	async function readRequest(db, id) {
		return graphql(
			schema,
			`
				{
					PublisherRequest {
						id
						lastUpdated {
							timestamp
							user
						}
						state
						publisherId
						publicationEstimate
						primaryContact {
							givenName
							familyName
							email
						}
						name
						language
						metadataDelivery
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
						publication {
							title
							type
							subtitle
							language
							publicationTime
							additionalDetails
							authors {
								givenName
								familyName
								role
							}
							series {
								identifier
								name
								volume
							}
							electronicDetails {
								format
							}
							printDetails {
								manufacturer
								city
								run
								edition
								format
							}
							mapDetails {
								scale
							}
						}
					}
				}
			`,
			{db, id}
		);
	}

	async function removeRequest(db, id) {
		return graphql(
			schema,
			`
				mutation($_id: ID) {
					deletePublisherRequest(_id: $_id) {
						_id
					}
				}
			`,
			{db, id}
		);
	}

	async function updateRequest(db, id, data) {
		return graphql(
			schema,
			`
				mutation(
					$state: String
					$publisherId: String
					$publicationEstimate: Int
					$primaryContact: [PrimaryContactRequestInput]
					$name: String
					$language: String
					$metadataDelivery: String
					$email: String
					$phone: String
					$website: String
					$aliases: [String]
					$notes: [String]
					$activity: ActivityInput
					$streetAddress: StreetAddressInput
					$publication: ISBNISMNPublicationRequestInput
				) {
					updatePublisherRequest(
						state: $state
						publisherId: $publisherId
						publicationEstimate: $publicationEstimate
						primaryContact: $primaryContact
						name: $name
						language: $language
						metadataDelivery: $metadataDelivery
						email: $email
						phone: $phone
						website: $website
						aliases: $aliases
						notes: $notes
						activity: $activity
						streetAddress: $streetAddress
						publication: $publication
					) {
						name
						lastUpdated {
							timestamp
							user
						}
					}
				}
			`,
			{db, id, data}
		);
	}

	async function queryRequests(db) {
		return graphql(
			schema,
			`
				{
					PublisherRequests{
						id
						lastUpdated {
							timestamp
							user
						}
						state
						publisherId
						publicationEstimate
						primaryContact {
							givenName
							familyName
							email
						}
						name
						language
						metadataDelivery
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
						publication {
							title
							type
							subtitle
							language
							publicationTime
							additionalDetails
							authors {
								givenName
								familyName
								role
							}
							series {
								identifier
								name
								volume
							}
							electronicDetails {
								format
							}
							printDetails {
								manufacturer
								city
								run
								edition
								format
							}
							mapDetails {
								scale
							}
						}
					}
				}
			`,
			db
		);
	}
}
