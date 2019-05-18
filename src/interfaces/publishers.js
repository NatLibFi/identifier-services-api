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
import resolvers from '../graphql/resolvers';

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
		const query = `
			{
				Publishers{
					_id
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
					lastUpdated {
						timestamp
						user
					}
				}
			}
		`;
		const root = {
			Publishers: resolvers.Publishers
		};
		try {
			const result = await graphql(schema, query, root, db);
			return result;
		} catch (err) {
			return err;
		}
	}

	async function read(db, id) {
		const query = `
			{
				Publisher{
					_id
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
					lastUpdated {
						timestamp
						user
					}
				}
			}
		`;
		const root = {
			Publisher: resolvers.Publisher
		};
		try {
			const result = await graphql(schema, query, root, {id, db});
			return result;
		} catch (err) {
			return err;
		}
	}

	async function create(db, data) {
		const query = `
			mutation($input: PublisherInput){
				createPublisher(input: $input) {
					name
					language
				}
			}
		`;
		const root = {
			createPublisher: resolvers.createPublisher
		};
		try {
			const result = await graphql(schema, query, root, db, {input: data});
			return result;
		} catch (err) {
			return err;
		}
	}

	async function update(db, id, data) {
		const query = `
			mutation($input: PublisherInput){
				updatePublisher(input: $input) {
					name
					language
				}
			}
		`;
		const root = {
			updatePublisher: resolvers.updatePublisher
		};
		try {
			const result = await graphql(schema, query, root, {db, id}, {input: data});
			return result;
		} catch (err) {
			return err;
		}
	}

	async function remove(db, id) {
		const query = `
			mutation($_id: ID){
				deletePublisher(_id: $_id) {
					name
					language
				}
			}
		`;
		const root = {
			deletePublisher: resolvers.deletePublisher
		};
		try {
			const result = await graphql(schema, query, root, {db, id});
			return result;
		} catch (err) {
			return err;
		}
	}

	async function createRequests(db, data) {
		const query = `
			mutation($input: PublisherRequestInput){
				createPublisherRequests(input: $input) {
					name
					language
				}
			}
		`;
		const root = {
			createPublisherRequests: resolvers.createPublisherRequests
		};
		try {
			const result = await graphql(schema, query, root, db, {input: data});
			return result;
		} catch (err) {
			return err;
		}
	}

	async function readRequest(db, id) {
		const query = `
			{
				PublisherRequest {
					_id
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
		`;
		const root = {
			PublisherRequest: resolvers.PublisherRequest
		};
		try {
			const result = await graphql(schema, query, root, {id, db});

			return result;
		} catch (err) {
			return err;
		}
	}

	async function removeRequest(db, id) {
		const query = `
			mutation($_id: ID){
				deletePublisherRequest(_id: $_id) {
					name
					language
				}
			}
		`;
		const root = {
			deletePublisherRequest: resolvers.deletePublisherRequest
		};
		try {
			const result = await graphql(schema, query, root, {db, id});
			return result;
		} catch (err) {
			return err;
		}
	}

	async function updateRequest(db, id, data) {
		const query = `
			mutation($input: PublisherRequestInput){
				updatePublisherRequest(input: $input) {
					name
					language
				}
			}
		`;
		const root = {
			updatePublisherRequest: resolvers.updatePublisherRequest
		};
		try {
			const result = await graphql(schema, query, root, {db, id}, {input: data});
			return result;
		} catch (err) {
			return err;
		}
	}

	async function queryRequests(db) {
		const query = `
			{
				PublisherRequests{
					_id
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
		`;
		const root = {
			PublisherRequests: resolvers.PublisherRequests
		};
		try {
			const result = await graphql(schema, query, root, db);
			return result;
		} catch (err) {
			return err;
		}
	}
}
