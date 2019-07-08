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
    createPublicationIsbnIsmn(input:PublicationIsbnIsmnInput ): PublicationIsbnIsmn!
    
    createPublicationRequestIsbnIsmn(input:PublicationIsbnIsmnRequestInput ): PublicationIsbnIsmnRequest!
        
    createPublicationIssn(input: PublicationIssnInput):PublicationIssn  
    
    createPublicationRequestIssn(input:PublicationRequestIssnInput):PublicationIssnRequest

    
    deletePublicationIsbnIsmn(id: ID!): PublicationIsbnIsmn
    
    deletePublicationIssn(id: ID!): PublicationIssn

    updatePublicationIsbnIsmn(id: ID, input: PublicationIsbnIsmnInput ): PublicationIsbnIsmn!
    
    updatePublicationRequestIsbnIsmn(id:ID, input: PublicationIsbnIsmnRequestInput ): PublicationIsbnIsmnRequest!
    
    updatePublicationIssn(id: ID, input: PublicationIssnInput):PublicationIssn  

    updatePublicationRequestIssn(id:ID, input: PublicationRequestIssnInput):PublicationIssnRequest

    deletePublicationRequestIsbnIsmn(id: ID!): PublicationIsbnIsmnRequest
    deletePublicationRequestIssn(id: ID!): PublicationIssnRequest
}

union TitleOrIdentifier = Title | Identifier
input TitleOrIdentifierInput {
    title: TitleInput 
    Identifier: IdentifierInput
} 

type Title{
    title: String
}
input TitleInput{
    title: String
}

type Identifier{
    identifier: String
}
input IdentifierInput{
    identifier: String
}

type SeriesDetails{
    volume: Int
    titleOrIdentifier: TitleOrIdentifier
}
input SeriesDetailsInput{
    volume: Int
    titleOrIdentifier: TitleOrIdentifierInput
}

type SeriesDetailsIssn{
    mainSeries: TitleOrIdentifier
    subSeries: TitleOrIdentifier
}

input SeriesDetailsIssnInput{
    mainSeries: TitleOrIdentifierInput
    subSeries: TitleOrIdentifierInput
}

type ElectronicPublicationDetails{
    format: FileFormat
}

union FormatDetailsIsbnIsmn = FormatDetails1 | FormatDetails2 | FormatDetails3

input FormatDetailsIsbnIsmnInput{ 
    formatDetails1: FormatDetailsInput1
    formatDetails2: FormatDetailsInput2 
    formatDetails3: FormatDetailsInput3
}

union FormatDetailsIssn = FormatDetails4 | FormatDetails5
input FormatDetailsIssnInput {
    formatDetails4: FormatDetailsInput4
    formatDetails5: FormatDetailsInput5
}

type FormatDetails1 {
    fileFormat: FileFormat!
    format: Format!
}
input FormatDetailsInput1 {
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
input FormatDetailsInput2{
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
input FormatDetailsInput3 {
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
input FormatDetailsInput4 {
    format: Format!
}
type FormatDetails5 {
    format: Format!
    url: String!
}
input FormatDetailsInput5 {
    format: Format!
    url: String!
}

type PreviousPublication{
    lastYear: Int
    lastNumber: Int
    titleOrIdentifier: TitleOrIdentifier
}
input PreviousPublicationInput{
    lastYear: Int
    lastNumber: Int
    titleOrIdentifierInput: TitleOrIdentifierInput
}

union Category = Category1 | Category2

input CategoryInput {
    category1: CategoryInput1
    category2: CategoryInput2
}

type Category1{
    type: Type!
}
input CategoryInput1{
    type: Type!
}

type Category2{
    type: Type!
    mapDetails: MapDetails
}
input CategoryInput2{
    type: Type!
    mapDetails: MapDetailsInput
}
type MapDetails{
    scale: String
}
input mapDetailsInput{
    scale: String
}

input seriesInput{
    identifier: String!
    name: String!
    volume: Int
}

input electronicPublicationDetailsInput{
    format: FileFormat!
}

input printDetailsInput{
    manufacturer: String!
    city: String
    run: Int
    edition: Int
    format: String
}

type Authors{
    givenName: String!
    familyName: String!
    role: String!
}
input AuthorsInput{
    givenName: String!
    familyName: String!
    role: String!
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
    authors: [Authors]!
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
    authors: [Authors]!
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
    authors: [Authors]!
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
input PublicationIsbnIsmnInput{
    title: String!
    subtitle: String
    language: Language!
    additionalDetails: String
    publicationTime: String!
    isPublic: Boolean!
    authors:[AuthorsInput]!
    seriesDetails: SeriesDetailsInput
    formatDetails: FormatDetailsIsbnIsmnInput!
    state: State!
    id: String
    publisher: String!
    metaDataReference: String
    associatedRange: String!
    category: CategoryInput
    notes: [String]
    lastUpdated: LastUpdatedInput
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
input PublicationIssnInput{ 
    title: String!
    subtitle: String
    language: Language!
    additionalDetails: String
    state: State!
    id: String
    manufacturer: String
    city: String
    firstYear: Int!
    firstNumber: Int
    frequency: Frequency
    type: IssnType!
    formatDetails: FormatDetailsIssnInput
    previousPublication: PreviousPublicationInput
    otherMedium: TitleOrIdentifierInput
    seriesDetails: SeriesDetailsIssnInput
    publisher: PublisherBaseInput!
    lastUpdated: LastUpdatedInput
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
    authors: [Authors]!
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
    authors: [Authors]!
    seriesDetails: SeriesDetails
    formatDetails: FormatDetailsIsbnIsmn!
}

input PublicationIsbnIsmnRequestInput{
    title: String!
    subtitle: String
    language: Language!
    additionalDetails: String
    publicationTime: String!
    isPublic: Boolean!
    authors:[AuthorsInput]!
    seriesDetails: SeriesDetailsInput
    formatDetails: FormatDetailsIsbnIsmnInput!
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
input PublicationRequestIssnInput{ 
    title: String!
    subtitle: String
    language: Language!
    additionalDetails: String
    state: State!
    id: String
    manufacturer: String
    city: String
    firstYear: Int!
    firstNumber: Int
    frequency: Frequency
    type: IssnType!
    formatDetails: FormatDetailsIssnInput  
    previousPublication: PreviousPublicationInput
    otherMedium: TitleOrIdentifierInput
    seriesDetails: SeriesDetailsIssnInput    
    publisher: PublisherBaseInput!
    lastUpdated: LastUpdatedInput
    notes: [String]
    backgroundProcessingState: BackgroundProcessingState  
    createdResource: String
    rejectionReason: String
}

 `;
