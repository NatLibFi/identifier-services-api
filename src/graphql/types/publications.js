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
    publication_ISBN_ISMN(id:ID!): ISBN_ISMN
     
    publication_ISSN(id:ID!): ISSN
        
    publicationRequest_ISBN_ISMN(id:ID!): ISBN_ISMN_Request
        
    publicationRequest_ISSN(id:ID!): ISSN_Request

    Publications_ISBN_ISMN: [ISBN_ISMN]   

    Publications_ISSN: [ISSN]
    
    PublicationRequests_ISBN_ISMN: [ISBN_ISMN_Request]
    
    PublicationRequests_ISSN: [ISSN_Request]

}

type Mutation{
    createPublicationIsbnIsmn(input:InputPublicationIsbnIsmn ): ISBN_ISMN!
    
    createPublicationRequestIsbnIsmn(input:InputPublicationIsbnIsmnRequest ): ISBN_ISMN_Request!
        
    createPublicationIssn(input: InputPublicationIssn):ISSN  
    
    createPublicationRequestIssn(input:InputPublicationRequestIssn):ISSN_Request

    
    deletePublicationIsbnIsmn(id: ID!): ISBN_ISMN
    
    deletePublicationIssn(id: ID!): ISSN


    updatePublicationIsbnIsmn(id: ID, input: InputPublicationIsbnIsmn ): ISBN_ISMN!
    
    updatePublicationRequestIsbnIsmn(id:ID, input: InputPublicationIsbnIsmnRequest ): ISBN_ISMN_Request!
    
    updatePublicationIssn(id: ID, input: InputPublicationIssn):ISSN  

    updatePublicationRequestIssn(id:ID, input: InputPublicationRequestIssn):ISSN_Request

    deletePublicationRequestIsbnIsmn(id: ID!): ISBN_ISMN_Request
    deletePublicationRequestIssn(id: ID!): ISSN_Request
}

input InputPublicationIsbnIsmn{
    title: String!,  publisher:String!, melindaId: String, type: String!, 
        subtitle: String, language: String!, publicationTime: String!, additionalDetails: String, authors:[authorInput], 
        series: seriesInput, electronicDetails: electronicDetailsInput, printDetails: printDetailsInput, 
        mapDetails: mapDetailsInput, lastUpdated: lastUpdatedInput
}

input InputPublicationIsbnIsmnRequest{
    title: String!, publisher:String!, state:String!, type: String, subtitle: String, language: String, 
        publicationTime: String, additionalDetails: String, authors:[authorInput], series: seriesInput, 
        electronicDetails: electronicDetailsInput, printDetails: printDetailsInput, mapDetails: mapDetailsInput, 
        lastUpdated: lastUpdatedInput
}

input InputPublicationIssn{ 
    title: String! ,publicationId: String, publisher: String!, melindaId: String,
    type: String!, subtitle: String, language: String!, year: Int!, number: Int, frequency: String!, additionalDetails: String,
    electronicDteails: electronicDetailsISSNInput, printDetails: printDetailsISSNInput, seriesDetails: seriesDetailsISSNInput, 
    mainSeries: seriesDetailsISSNInput, subSeries: seriesDetailsISSNInput, otherMedium: seriesDetailsISSNInput, 
    previousPublication: previousPublicationInput, lastUpdated: lastUpdatedInput
}
input InputPublicationRequestIssn{ 
    title: String!, publisher: String!, type: String!, subtitle: String, language: String!, 
    year: Int!, number: Int, frequency: String!, additionalDetails: String, electronicDteails: electronicDetailsISSNInput, 
    printDetails: printDetailsISSNInput, seriesDetails: seriesDetailsISSNInput, state: String!,
    mainSeries: seriesDetailsISSNInput, subSeries: seriesDetailsISSNInput, otherMedium: seriesDetailsISSNInput, 
    previousPublication: previousPublicationInput, lastUpdated: lastUpdatedInput
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
type SeriesDetailsISSN{
    identifier: String!
    name: String!
}
input seriesDetailsISSNInput{
    identifier: String!
    name: String!
}

type ElectronicDetails{
    format: String
}

type ElectronicDetailsISSN{
    url: String
}
input electronicDetailsISSNInput{
    url: String
}

type PrintDetails{
    manufacturer: String
    city: String
    run: Int
    edition: Int
    format: String
}

type PrintDetailsISSN{
    manufacturer: String
    city: String
}
input printDetailsISSNInput{
    manufacturer: String
    city: String
}

type MapDetails{
    scale: String
}

type PreviousPublication{
    identifier: String!
    name: String!
    year: Int
    number: Int
}
input previousPublicationInput{
    identifier: String!
    name: String!
    year: Int
    number: Int
}

input lastUpdatedInput{
    timestamp: String
    user: String!
}

input authorInput{
    givenName: String!
    familyName: String!
    role: String!
}

input seriesInput{
    identifier: String!
    name: String!
    volume: Int
}

input electronicDetailsInput{
    format: String!
}

input printDetailsInput{
    manufacturer: String!
    city: String
    run: Int
    edition: Int
    format: String
}

input mapDetailsInput{
    scale: String
}

type ISBN_ISMN{
    _id: ID!
    title: String!
    publisher: String!
    melindaId: String
    type: String!
    subtitle: String
    language: String!
    publicationTime: String!
    additionalDetails: String
    authors: [Author]
    series: Series
    electronicDetails: ElectronicDetails
    printDetails: PrintDetails
    mapDetails: MapDetails
    lastUpdated: LastUpdated
}

type ISSN{
    _id: ID!
    title: String!
    publicationId: String
    publisher: String!
    melindaId: String
    type: String!
    subtitle: String
    language: String!
    year: Int!
    number: Int
    frequency: String!
    additionalDetails: String
    electronicDteails: ElectronicDetailsISSN
    printDetails: PrintDetailsISSN
    seriesDetails: SeriesDetailsISSN
    mainSeries: SeriesDetailsISSN
    subSeries: SeriesDetailsISSN
    otherMedium: SeriesDetailsISSN
    previousPublication: PreviousPublication
    lastUpdated: LastUpdated
}

type ISBN_ISMN_Request{
    _id: ID!
    title: String!
    type: String!
    subtitle: String
    publisher:String!
    language: String!
    publicationTime: String!
    additionalDetails: String
    authors: [Author]
    series: Series
    electronicDetails: ElectronicDetails
    printDetails: PrintDetails
    mapDetails: MapDetails
    lastUpdated: LastUpdated
    state: String!
}

type ISSN_Request{
    _id: ID!
    title: String!
    publisher: String!
    type: String!
    subtitle: String
    language: String!
    year: Int!
    number: Int
    frequency: String!
    additionalDetails: String
    electronicDteails: ElectronicDetailsISSN
    printDetails: PrintDetailsISSN
    seriesDetails: SeriesDetailsISSN
    mainSeries: SeriesDetailsISSN
    subSeries: SeriesDetailsISSN
    otherMedium: SeriesDetailsISSN
    previousPublication: PreviousPublication
    lastUpdated: LastUpdated
    state: String!
}

 `;
