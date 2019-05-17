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
import resolvers from '../graphql/resolvers';

export default function () {
	const queryReturn = `
    _id
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

	async function create(db, data) {
		try {
			const query = `
            mutation($inputTemplate: InputTemplate ){
                createTemplate(inputTemplate: $inputTemplate){
                    ${queryReturn}
                }
            }
        `;

			const args = {inputTemplate: data};
			const resolve = {createTemplate: resolvers.createTemplate};
			const result = await graphql(schema, query, resolve, db, args);
			return result;
		} catch (err) {
			return err;
		}
	}

	async function read(db, id) {
		try {
			const query = `
            {
                template(id:${JSON.stringify(id)}){
                    ${queryReturn}
                }
            }
        `;
			const resolve = {template: resolvers.template};
			const result = await graphql(schema, query, resolve, db, {id: id});
			return result;
		} catch (err) {
			return err;
		}
	}

	async function remove(db, id) {
		try {
			const query = `
            mutation{
                deleteTemplate(id: ${JSON.stringify(id)}) {
                    _id
                }
            }
        `;
			const resolve = {deleteTemplate: resolvers.deleteTemplate};
			const result = await graphql(schema, query, resolve, db);
			return result;
		} catch (err) {
			return err;
		}
	}

	async function update(db, id, data) {
		try {
			const query = `
                mutation($id:ID, $inputTemplate:InputTemplate){
                    updateTemplate(id:$id, inputTemplate: $inputTemplate){
                        ${queryReturn}
                    }
                }
            `;
			const args = {id: id, inputTemplate: data};
			const resolve = {updateTemplate: resolvers.updateTemplate};
			const result = await graphql(schema, query, resolve, db, args);
			return result;
		} catch (err) {
			return err;
		}
	}

	async function query(db) {
		const query = `
            {
                Templates{
                    ${queryReturn}
                }
            }
        `;

		const resolve = {Templates: resolvers.Templates};
		const result = await graphql(schema, query, resolve, db);
		return result;
	}
}
