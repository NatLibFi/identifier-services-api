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

export default `




    type ISSN{
        _id: ID!
        rangeStart: Int!
        rangeEnd: Int!
        active: Boolean!
        reservedCount: Int!
        lastUpdated: LastUpdated
    }

    input ISSNInput{
        rangeStart: Int!
        rangeEnd: Int!
        active: Boolean!
        reservedCount: Int!
        lastUpdated: LastUpdatedInput
    }
 
    type ISMN{
        _id: ID!
        prefix: String!
        rangeStart: Int!
        rangeEnd: Int!
        publisher: String
        active: Boolean!
        reservedCount: Int!
        lastUpdated: LastUpdated
    }

    input ISMNInput{
        prefix: String!
        rangeStart: Int!
        rangeEnd: Int!
        publisher: String
        active: Boolean!
        reservedCount: Int!
        lastUpdated: LastUpdatedInput
    }
        
    type ISBN{
        _id: ID!
        prefix: String!
        language: String!
        rangeStart: Int!
        rangeEnd: Int!
        publisher: String
        active: Boolean!
        reservedCount: Int!
        lastUpdated: LastUpdated

    }

    input ISBNInput{
        prefix: String!
        language: String!
        rangeStart: Int!
        rangeEnd: Int!
        publisher: String
        active: Boolean!
        reservedCount: Int!
        lastUpdated: LastUpdatedInput
    }


    type Query{
        ISBN: ISBN
        ISBNs: [ISBN]
        ISMN: ISMN
        ISMNs: [ISMN]
        ISSN: ISSN
        ISSNs:[ISSN]
     }
    
     type Mutation{
         createISBN(input: ISBNInput):ISBN!

         updateISBN(input: ISBNInput): ISBN!

         createISMN(input: ISMNInput):ISMN!

         updateISMN(input: ISMNInput): ISBN!

         createISSN(input: ISSNInput):ISSN!

         updateISSN(input: ISSNInput): ISSN!
     }

 `;
