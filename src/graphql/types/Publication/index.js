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
 type Query{
    publication_ISBN_ISMN(id: String, title: String, publicationId: String, melindaId: String, type: String, 
        subtitle: String, language: String, publicationTime: String, additionalDetails: String, authorGivenName: String,
        authorFamilyName: String, authorRole: String, seriesId: String, seriesName: String, seriesVolume: String, electronicFormat: String,
        manufacturer: String, city: String, run: Int, edition: Int, printFormat: String, mapScale: String, timeStamp: String, user: String ): ISBN_ISMN
     
    publication_ISSN(id: String, title: String, publicationId: String, melindaId: String, type: String, 
        subtitle: String, language: String, additionalDetails: String, year: Int, number: Int, frequency: String, timeStamp: String, user: String ): ISSN
        
    publicationRequest_ISBN_ISMN(id: String, title: String, type: String,subtitle: String, language: String, 
        publicationTime: String, additionalDetails: String, authorGivenName: String, authorFamilyName: String, 
        authorRole: String, seriesId: String, seriesName: String, seriesVolume: String, electronicFormat: String,
        manufacturer: String, city: String, run: Int, edition: Int, printFormat: String, mapScale: String, state: String ): ISBN_ISMN_Request
        
    publicationRequest_ISSN(id: String, title: String, type: String, subtitle: String, language: String, additionalDetails: String, 
        year: Int, number: Int, frequency: String, timeStamp: String, user: String ): ISSN_Request

    publications_ISBN_ISMN: [ISBN_ISMN]   

    publications_ISSN: [ISSN]
    
    publicationRequests_ISBN_ISMN: [ISBN_ISMN_Request]
    
    publicationRequests_ISSN: [ISSN_Request]


}

type LastUpdated{
    timestamp: String!
    user: String!
}

type Author{
    givenName: String!
    familyName: String!
    role: String!
}

type Series{
    identifier: String!
    name: String!
    volume: Int
}

type ElectronicDetails{
    format: String
}

type PrintDetails{
    manufacturer: String
    city: String
    run: Int
    edition: Int
    format: String
}

type MapDetails{
    scale: String
}

type ISBN_ISMN{
    id: String!
    title: String!
    publicationId: String
    melindaId: String
    type: String!
    subtitle: String
    language: String!
    publicationTime: String!
    additionalDetails: String
    authors(authorGivenName: String, authorFamilyName: String, authorRole: String): [Author]
    series(identifier: String, name: String, voulme: Int): Series
    electronicDetails(format: String): ElectronicDetails
    printDetails(manufacturer: String, city: String, run: Int, edition: Int, format: String): PrintDetails
    mapDetails(scale: String): MapDetails
    lastUpdated(timeStamp: String, user: String): LastUpdated
}

type ISSN{
    id: String!
    title: String!
    publicationId: String
    melindaId: String
    type: String!
    subtitle: String
    language: String!
    year: Int!
    number: Int
    frequency: String!
    additionalDetails: String    
    lastUpdated(timeStamp: String, user: String): LastUpdated
}

type ISBN_ISMN_Request{
    id: String!
    title: String!
    type: String!
    subtitle: String
    language: String!
    publicationTime: String!
    additionalDetails: String
    authors(authorGivenName: String, authorFamilyName: String, authorRole: String): [Author]
    series(identifier: String, name: String, voulme: Int): Series
    electronicDetails(format: String): ElectronicDetails
    printDetails(manufacturer: String, city: String, run: Int, edition: Int, format: String): PrintDetails
    mapDetails(scale: String): MapDetails
    lastUpdated(timeStamp: String, user: String): LastUpdated
    state: String!
}

type ISSN_Request{
    id: String!
    title: String!
    type: String!
    subtitle: String
    language: String!
    year: Int!
    number: Int
    frequency: String!
    additionalDetails: String    
    lastUpdated(timeStamp: String, user: String): LastUpdated
}
 
 `;
