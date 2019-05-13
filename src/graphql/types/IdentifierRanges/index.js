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


    type LastUpdated{
        timeStamp: String!
        user: String!
    }
    input LastUpdatedInput{
        user: String!
    }

    type ISSN{
<<<<<<< HEAD
        _id: String!
=======
        id: String!
>>>>>>> c94bb448d73e5e9be0d37648efe87d68c2e4a7bd
        rangeStart: Int!
        rangeEnd: Int!
        active: Boolean!
        reservedCount: Int!
        lastUpdated: LastUpdated
    }
 
    type ISMN{
<<<<<<< HEAD
        _id: String!
=======
        id: String!
>>>>>>> c94bb448d73e5e9be0d37648efe87d68c2e4a7bd
        prefix: String!
        rangeStart: Int!
        rangeEnd: Int!
        publisher: String
        active: Boolean!
        reservedCount: Int!
        lastUpdated: LastUpdated
    }
        
    type ISBN{
<<<<<<< HEAD
        _id: ID!
=======
        id: String!
>>>>>>> c94bb448d73e5e9be0d37648efe87d68c2e4a7bd
        prefix: String!
        language: String!
        rangeStart: Int!
        rangeEnd: Int!
        publisher: String
        active: Boolean!
        reservedCount: Int!
        lastUpdated: LastUpdated

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
         createISBN(
            prefix: String
            language: String
            rangeStart: Int
            rangeEnd: Int
            publisher: String
            active: Boolean
            reservedCount: Int
            lastUpdated: LastUpdatedInput
         ):ISBN

         updateISBN(
            prefix: String
            language: String
            rangeStart: Int
            rangeEnd: Int
            publisher: String
            active: Boolean
            reservedCount: Int
         ): ISBN

         createISMN(
            prefix: String
            rangeStart: Int
            rangeEnd: Int
            publisher: String
            active: Boolean
            reservedCount: Int
            lastUpdated: LastUpdatedInput
         ):ISMN

         updateISMN(
            prefix: String
            rangeStart: Int
            rangeEnd: Int
            publisher: String
            active: Boolean
            reservedCount: Int
         ): ISMN

         createISSN(
            rangeStart: Int
            rangeEnd: Int
            active: Boolean
            reservedCount: Int
         ):ISSN

         updateISSN(
            rangeStart: Int
            rangeEnd: Int
            active: Boolean
            reservedCount: Int
         ): ISSN
     }

 `;
