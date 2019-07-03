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
    publicationBase: PublicationBase

    publication_ISBN_ISMN(id:ID!): PublicationIsbnIsmn
     
    publication_ISSN(id:ID!): PublicationIssn
        
    publicationRequest_ISBN_ISMN(id:ID!): PublicationIsbnIsmnRequest
        
    publicationRequest_ISSN(id:ID!): PublicationIssnRequest

    Publications_ISBN_ISMN: [PublicationIsbnIsmn]   

    Publications_ISSN: [PublicationIssn]
    
    PublicationRequests_ISBN_ISMN: [PublicationIsbnIsmnRequest]
    
    PublicationRequests_ISSN: [PublicationIssnRequest]

}

type Mutation{
    createPublicationIsbnIsmn(input:InputPublicationIsbnIsmn ): PublicationIsbnIsmn!
    
    createPublicationRequestIsbnIsmn(input:InputPublicationIsbnIsmnRequest ): PublicationIsbnIsmnRequest!
        
    createPublicationIssn(input: InputPublicationIssn):PublicationIssn  
    
    createPublicationRequestIssn(input:InputPublicationRequestIssn):PublicationIssnRequest

    
    deletePublicationIsbnIsmn(id: ID!): PublicationIsbnIsmn
    
    deletePublicationIssn(id: ID!): PublicationIssn

    updatePublicationIsbnIsmn(id: ID, input: InputPublicationIsbnIsmn ): PublicationIsbnIsmn!
    
    updatePublicationRequestIsbnIsmn(id:ID, input: InputPublicationIsbnIsmnRequest ): PublicationIsbnIsmnRequest!
    
    updatePublicationIssn(id: ID, input: InputPublicationIssn):PublicationIssn  

    updatePublicationRequestIssn(id:ID, input: InputPublicationRequestIssn):PublicationIssnRequest

    deletePublicationRequestIsbnIsmn(id: ID!): PublicationIsbnIsmnRequest
    deletePublicationRequestIssn(id: ID!): PublicationIssnRequest
}

input InputPublicationIsbnIsmn{
    title: String!,  publisher:String!, melindaId: String, type: String!, 
        subtitle: String, language: Language!, publicationTime: String!, additionalDetails: String, authors:[authorInput], 
        series: seriesInput, electronicDetails: electronicDetailsInput, printDetails: printDetailsInput, 
        mapDetails: mapDetailsInput, lastUpdated: lastUpdatedInput
}

input InputPublicationIsbnIsmnRequest{
    title: String!, publisher:String!, state:String!, type: String, subtitle: String, language: Language, 
        publicationTime: String, additionalDetails: String, authors:[authorInput], series: seriesInput, 
        electronicDetails: electronicDetailsInput, printDetails: printDetailsInput, mapDetails: mapDetailsInput, 
        lastUpdated: lastUpdatedInput
}

input InputPublicationIssn{ 
    title: String! ,publicationId: String, publisher: String!, melindaId: String,
    type: String!, subtitle: String, language: Language!, year: Int!, number: Int, frequency: String!, additionalDetails: String,
    electronicDteails: electronicDetailsISSNInput, printDetails: printDetailsISSNInput, seriesDetails: seriesDetailsIssnInput, 
    mainSeries: seriesDetailsIssnInput, subSeries: seriesDetailsIssnInput, otherMedium: seriesDetailsIssnInput, 
    previousPublication: previousPublicationInput, lastUpdated: lastUpdatedInput
}
input InputPublicationRequestIssn{ 
    title: String!, publisher: String!, type: String!, subtitle: String, language: Language!, 
    year: Int!, number: Int, frequency: String!, additionalDetails: String, electronicDteails: electronicDetailsISSNInput, 
    printDetails: printDetailsISSNInput, seriesDetails: seriesDetailsIssnInput, state: String!,
    mainSeries: seriesDetailsIssnInput, subSeries: seriesDetailsIssnInput, otherMedium: seriesDetailsIssnInput, 
    previousPublication: previousPublicationInput, lastUpdated: lastUpdatedInput
}

type Author{
    givenName: String!
    familyName: String!
    role: String!
}

type SeriesDetails{
    volume: Int
    titleOrIdentifier: TitleOrIdentifier
}

union TitleOrIdentifier = Title | Identifier

type Title{
    title: String
}

type Identifier{
    identifier: String
}

type SeriesDetailsIssn{
    mainSeries: TitleOrIdentifier
    subSeries: TitleOrIdentifier
}

input seriesDetailsIssnInput{
    mainSeries: TitleOrIdentifier
    subSeries: TitleOrIdentifier
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

union FormatDetailsIsbnIsmn = FormatDetails1 | FormatDetails2 | FormatDetails3
union FormatDetailsIssn = FormatDetails4 | FormatDetails5

type FormatDetails1 {
    fileFormat: FileFormat!
    format: Format!
}

type FormatDetails2 {
    printFormat: PrintFormat!
    manufacturer: String
    city: String
    run: Int
    edition: Int
    format: Format!
}
type FormatDetails3 {
    fileFormat: FileFormat!
    printFormat: PrintFormat!
    manufacturer: String
    city: String
    run: Int
    edition: Int
    format: Format!
}
type FormatDetails4 {
    format: Format!
}
type FormatDetails5 {
    format: Format!
    url: String!
}

type MapDetails{
    scale: String
}

type PreviousPublication{
    lastYear: Int
    lastNumber: Int
    titleOrIdentifier: TitleOrIdentifier
}

union Category = Category1 | Category2

type Category1{
    type: Type
}

type Category2{
    type: Type
    mapDetails: MapDetails
}

type MapDetails{
    scale: String
}

input previousPublicationInput{
    lastYear: Int
    lastNumber: Int
    titleOrIdentifier: TitleOrIdentifier
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

input printDetailsInput{electronicDetails
    electronicDetails
    electronicDetails
    electronicDetails
    electronicDetails
    electronicDetails
    ElectronicDetails
    ElectronicDetails
    electronicDetails
    electronicDetails
    manufacturer: String!
    city: String
    run: Int
    edition: Int
    format: String
}

input mapDetailsInput{
    scale: String
}

type PublicationBase{
    _id: ID!
    title: String!
    subtitle: String
    language: Language!
    additionalDetails: String
}

type PublicationIsbnIsmnBase{
    _id: ID!
    title: String!
    subtitle: String
    language: Language!
    additionalDetails: String
    publicationTime: String!
    isPublic: Boolean!
    authors: [Author]!
    seriesDetails: SeriesDetails
    formatDetails: FormatDetailsIsbnIsmn!
}

type PublicationIsbnIsmnContent{
    _id: ID!
    title: String!
    subtitle: String
    language: Language!
    additionalDetails: String
    publicationTime: String!
    isPublic: Boolean!
    authors: [Author]!
    seriesDetails: SeriesDetails
    formatDetails: FormatDetailsIsbnIsmn!
    state: State!
    id: String!
    category: Category
}

type PublicationIsbnIsmn{
    _id: ID!
    title: String!
    melindaId: String
    subtitle: String
    language: Language!
    additionalDetails: String
    publicationTime: String!
    isPublic: Boolean!
    authors: [Author]!
    seriesDetails: SeriesDetails
    formatDetails: FormatDetailsIsbnIsmn!
    state: State!
    id: String!
    publisher: String!
    metadataReference: String
    associatedRange: String!
    category: Category
    notes: [String]
    lastUpdated: LastUpdated
}

type PublicationIssn{
    _id: ID!
    title: String!
    subtitle: String
    language: Language!
    additionalDetails: String
    state: State!
    id: String
    manufacturer: String
    city: String!
    firstYear: Int!
    firstNumber: Int!
    frequency: Frequency!
    type: IssnType!
    formatDetails: FormatDetailsIssn
    previousPublication: PreviousPublication
    otherMedium: TitleOrIdentifier
    seriesDetails: SeriesDetailsIssn
    metadataReference: String!
    associatedRange: String!
    lastUpdated: LastUpdated
    notes: [String]
}
type PublicationIssnContent{
    _id: ID!
    title: String!
    subtitle: String
    language: Language!
    additionalDetails: String
    state: State!
    id: String
    manufacturer: String
    city: String!
    firstYear: Int!
    firstNumber: Int!
    frequency: Frequency!
    type: IssnType!
    formatDetails: FormatDetailsIssn
    previousPublication: PreviousPublication
    otherMedium: TitleOrIdentifier
    seriesDetails: SeriesDetailsIssn
    
}

type PublicationIsbnIsmnRequestContent{
    _id: ID!
    backgroundProcessingState: BackgroundProcessingState
    state: State!
    rejectionReason: String
    createdResource: String
    title: String!
    subtitle: String
    language: Language!
    additionalDetails: String
    publicationTime: String
    isPublic: Boolean!
    authors: [Author]!
    seriesDetails: SeriesDetails
    formatDetails: FormatDetailsIsbnIsmn!
    id: String
    publisher:String!
    category: Category
}

type PublicationIsbnIsmnRequest{
    _id: ID!
    title: String!
    subtitle: String
    language: Language!
    additionalDetails: String
    publicationTime: String!
    isPublic: Boolean!
    authors: [Author]!
    seriesDetails: SeriesDetails
    formatDetails: FormatDetailsIsbnIsmn!
}

type PublicationIssnRequest{
    _id: ID!
    backgroundProcessingState: BackgroundProcessingState
    state: State!
    rejectionReason: String
    createdResource: String
    title: String!
    subtitle: String
    language: Language!
    additionalDetails: String
    id: String
    manufacturer: String
    city: String
    firstYear: Int!
    firstNumber: Int!
    frequency: Frequency!
    type: IssnType!
    formatDetails: FormatDetailsIssn
    previousPublication: PreviousPublication
    otherMedium: TitleOrIdentifier
    seriesDetails: SeriesDetailsIssn
    publisher: String!
    lastUpdated: LastUpdated
    notes: [String]
}

 `;
