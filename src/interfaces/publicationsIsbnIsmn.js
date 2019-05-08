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
		createISBN_ISMN,
		readISBN_ISMN,
		updateISBN_ISMN,
		removeISBN_ISMN,
		queryISBN_ISMN,
		createRequestISBN_ISMN,
		readRequestISBN_ISMN,
		updateRequestISBN_ISMN,
		removeRequestISBN_ISMN
	};

	async function createISBN_ISMN({db, req}) {
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
					createPublicationIsbnIsmn(
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

	async function readISBN_ISMN({db, params}) {
		return graphql(
			schema,
			`
				{
					publication_ISBN_ISMN {
						${queryReturn}
					}
				}
			`,
			{db, params}
		);
	}

	async function updateISBN_ISMN({db, req}) {
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
					updatePublicationIsbnIsmn(
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

	async function removeISBN_ISMN({db, params}) {
		return graphql(
			schema,
			`
				mutation($id: String) {
					deletePublicationIsbnIsmn(id: $id) {
						id
					}
				}
			`,
			{db, params}
		);
	}

	async function queryISBN_ISMN(db) {
		return graphql(
			schema,
			`
				{
					Publications_ISBN_ISMN {
						${queryReturn}
					}
				}
			`,
			db
		);
	}

	async function createRequestISBN_ISMN({db, req}) {
		return graphql(
			schema,
			`
				mutation(
					$id: String
					$title: String
					$state: String
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
					createPublicationRequestIsbnIsmn(
						id: $id
						title: $title
						state: $state
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
						id
					}
				}
			`,
			{db, req}
		);
	}

	async function readRequestISBN_ISMN({db, params}) {
		return graphql(
			schema,
			`
				{
					PublicationRequests_ISBN_ISMN {
						${queryReturn}
					}
				}
			`,
			{db, params}
		);
	}

	async function updateRequestISBN_ISMN({db, req}) {
		return graphql(
			schema,
			`
				mutation(
					$id: String
					$title: String
					$state: String
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
					updatePublicationRequestIsbnIsmn(
						id: $id
						title: $title
						state: $state
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
						id
					}
				}
			`,
			{db, req}
		);
	}

	async function removeRequestISBN_ISMN({db, params}) {
		return graphql(
			schema,
			`
				mutation($id: String) {
					deletePublicationRequestIsbnIsmn(id: $id) {
						id
					}
				}
			`,
			{db, params}
		);
	}

	
}
