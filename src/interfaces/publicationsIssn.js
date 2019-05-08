/* eslint-disable camelcase */
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

import {graphql} from 'graphql';
import schema from '../graphql';

export default function() {
	const queryReturn = `
	id
	title
	language
	publicationTime
	type
	language
	authors{
		givenName
		familyName
		role
	}
	printDetails{
		manufacturer
	}
	lastUpdated{
		timestamp
		user
	}`;

	return {
		createISSN,
		readISSN,
		updateISSN,
		removeISSN,
		queryISSN,
		createRequestISSN,
		readRequestISSN
		// updateRequestISSN,
		// removeRequestISSN,
	};

	async function createISSN({db, req}) {
		return graphql(
			schema,
			`
				mutation(
					$id: String
					$title: String
					$publicationId: String
					$melindaId: String
					$type: String
					$subtitle: String
					$language: String
					$publicationTime: String
					$additionalDetails: String
					$authors: [authorInput]
					$series: seriesInput
					$electronicDetails: electronicDetailsInput
					$printDetails: printDetailsInput
					$mapDetails: mapDetailsInput
					$lastUpdated: lastUpdatedInput
				) {
					createPublication(
						id: $id
						title: $title
						publicationId: $publicationId
						melindaId: $melindaId
						type: $type
						subtitle: $subtitle
						language: $language
						publicationTime: $publicationTime
						additionalDetails: $additionalDetails
						authors: $authors
						series: $series
						electronicDetails: $electronicDetails
						printDetails: $printDetails
						mapDetails: $mapDetails
						lastUpdated: $lastUpdated
					) {
						${queryReturn}
					}
				}
			`,
			{db, req}
		);
	}

	async function readISSN({db, params}) {
		return graphql(
			schema,
			`
				{
					publication_ISSN {
						${queryReturn}
					}
				}
			`,
			{db, params}
		);
	}

	async function updateISSN({db, req}) {
		return graphql(
			schema,
			`
				mutation(
					$id: String
					$title: String
					$publicationId: String
					$melindaId: String
					$type: String
					$subtitle: String
					$language: String
					$publicationTime: String
					$additionalDetails: String
					$authors: [authorInput]
					$series: seriesInput
					$electronicDetails: electronicDetailsInput
					$printDetails: printDetailsInput
					$mapDetails: mapDetailsInput
					$lastUpdated: lastUpdatedInput
				) {
					createPublication(
						id: $id
						title: $title
						publicationId: $publicationId
						melindaId: $melindaId
						type: $type
						subtitle: $subtitle
						language: $language
						publicationTime: $publicationTime
						additionalDetails: $additionalDetails
						authors: $authors
						series: $series
						electronicDetails: $electronicDetails
						printDetails: $printDetails
						mapDetails: $mapDetails
						lastUpdated: $lastUpdated
					) {
						${queryReturn}
					}
				}
			`,
			{db, req}
		);
	}

	async function removeISSN({db, params}) {
		return graphql(
			schema,
			`
				mutation($id: String) {
					deletePublication(id: $id) {
						id
					}
				}
			`,
			{db, params}
		);
	}

	async function queryISSN(db) {
		return graphql(
			schema,
			`
				{
					Publications_ISSN {
						${queryReturn}
					}
				}
			`,
			db
		);
	}

	async function createRequestISSN({db, req}) {
		return graphql(
			schema,
			`
				mutation(
					$id: String
					$title: String
					$publicationId: String
					$melindaId: String
					$type: String
					$subtitle: String
					$language: String
					$publicationTime: String
					$additionalDetails: String
					$authors: [authorInput]
					$series: seriesInput
					$electronicDetails: electronicDetailsInput
					$printDetails: printDetailsInput
					$mapDetails: mapDetailsInput
					$lastUpdated: lastUpdatedInput
				) {
					createPublication(
						id: $id
						title: $title
						publicationId: $publicationId
						melindaId: $melindaId
						type: $type
						subtitle: $subtitle
						language: $language
						publicationTime: $publicationTime
						additionalDetails: $additionalDetails
						authors: $authors
						series: $series
						electronicDetails: $electronicDetails
						printDetails: $printDetails
						mapDetails: $mapDetails
						lastUpdated: $lastUpdated
					) {
						${queryReturn}
					}
		`,
			{db, req}
		);
	}

	async function readRequestISSN({db, params}) {
		return graphql(
			schema,
			`
				{
					PublicationRequests_ISSN {
						${queryReturn}
					}
				}
			`,
			{db, params}
		);
	}
}
