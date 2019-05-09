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

export default function () {
	const queryReturn = `
    id
    name
    language
    subject
    body
    lastUpdated{
        timestamp
        user
    }
    `;

	return {
		create,
		read,
		remove,
		update,
		query
	};

	async function create({db, req}) {
		return graphql(
			schema,
			`
            mutation(
                $id:String 
                $language:String 
                $subject:String 
                $body:String 
                $lastUpdated:LastUpdatedInput
                ){
                createTemplate(
                    id:$id 
                    language:$language 
                    subject:$subject 
                    body:$body 
                    lastUpdated:$lastUpdated
                    ){
                    ${queryReturn}
                }
            }
            `,
			{db, req}
		);
	}

	async function read({db, params}) {
		return graphql(
			schema,
			`
                {
                    template{
                        ${queryReturn}
                    }
                }
            `,
			{db, params}
		);
	}

	async function remove({db, params}) {
		return graphql(
			schema,
			`
				mutation($id: String) {
					deleteTemplate(id: $id) {
						id
					}
				}
			`,
			{db, params}
		);
	}

	async function update({db, req}) {
		return graphql(
			schema,
			`
            mutation(
                $id:String 
                $language:String 
                $subject:String 
                $body:String 
                $lastUpdated:LastUpdatedInput
                ){
                updateTemplate(
                    id:$id 
                    language:$language 
                    subject:$subject 
                    body:$body 
                    lastUpdated:$lastUpdated
                    ){
                    ${queryReturn}
                }
            }
            `,
			{db, req}
		);
	}

	async function query({db, req}) {
		return graphql(
			schema,
			`
                {
                    Templates{
                        ${queryReturn}
                    }
                }
            `,
			{db, req}
		);
	}
}
