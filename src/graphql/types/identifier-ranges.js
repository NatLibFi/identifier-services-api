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

    type RangeBase{
        prefix: String!
        rangeStart: String!
        rangeEnd: String!
        active: Boolean!
    }
    type RangeIsbnContent{
        prefix: String!
        rangeStart: String!
        rangeEnd: String!
        active: Boolean!
        langauge: String!
    }
    type RangeIsmnContent{
        prefix: String!
        rangeStart: String!
        rangeEnd: String!
        active: Boolean!
    }
    type RangeIssnContent{
        prefix: String!
        rangeStart: String!
        rangeEnd: String!
        active: Boolean!
    }
    type RangeIssn{
        _id: ID!
        prefix: String!
        rangeStart: Int!
        rangeEnd: Int!
        active: Boolean!
        notes: [String!]
        lastUpdated: LastUpdated
    }

    input RangeIssnInput{
        prefix: String!
        rangeStart: Int!
        rangeEnd: Int!
        active: Boolean!
        notes: [String!]
        lastUpdated: LastUpdatedInput
    }
 
    type RangeIsmn{
        _id: ID!
        prefix: String!
        rangeStart: Int!
        rangeEnd: Int!
        active: Boolean!
        notes: [String!]
        lastUpdated: LastUpdated
    }

    input RangeIsmnInput{
        prefix: String!
        rangeStart: Int!
        rangeEnd: Int!
        active: Boolean!
        notes: [String!]
        lastUpdated: LastUpdatedInput
    }
        
    type RangeIsbn{
        _id: ID!
        prefix: String!
        rangeStart: Int!
        rangeEnd: Int!
        active: Boolean!
        language: String!
        notes: [String!]
        lastUpdated: LastUpdated

    }

    input RangeIsbnInput{
        prefix: String!
        rangeStart: Int!
        rangeEnd: Int!
        active: Boolean!
        language: String!
        notes: [String!]
        lastUpdated: LastUpdatedInput
    }


    type Query{
        ISBN: RangeIsbn
        ISBNs: [RangeIsbn]
        ISMN: RangeIsmn
        ISMNs: [RangeIsmn]
        ISSN: RangeIssn
        ISSNs:[RangeIssn]
     }
    
     type Mutation{
         createISBN(input: RangeIsbnInput): RangeIsbn!

         updateISBN(input: RangeIsbnInput): RangeIsbn!

         createISMN(input: RangeIsmnInput): RangeIsmn!

         updateISMN(input: RangeIsmnInput): RangeIsmn!

         createISSN(input: RangeIssnInput): RangeIssn!

         updateISSN(input: RangeIssnInput): RangeIssn!
     }

 `;
