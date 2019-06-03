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
        Publisher:Publisher
        Publishers:[Publisher]
        PublisherRequest: PublisherRequest
        PublisherRequests: [PublisherRequest]

    }




    type Activity{
        active: Boolean
        yearInactivated: Int
    }

    input ActivityInput{
        active: Boolean
        yearInactivated: Int
    }

    type StreetAddress{
        address: String!
        city: String!
        zip: String!
    }
    input StreetAddressInput{
        address: String!
        city: String!
        zip: String!
    }
 

    type PrimaryContactRequest{
        givenName: String!
        familyName: String!
        email: String!
    }

    input PrimaryContactRequestInput{
        givenName: String!
        familyName: String!
        email: String!
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
    type Series{
        identifier: String!
        name: String!
        volume: Int
    }
    input SeriesInput{
        identifier: String!
        name: String!
        volume: Int
    }

    type ElectronicDetailsPublisher{
        format: String!
    }
    input ElectronicDetailsPublisherInput{
        format: String!
    }

    type PrintDetails{
        manufacturer: String
        city: String
        run: Int
        edition: Int
        format: String
    }
    input PrintDetailsInput{
        manufacturer: String
        city: String
        run: Int
        edition: Int
        format: String
    }
    type MapDetails{
        scale: String
    }
    input MapDetailsInput{
        scale: String
    }
    type ISBNISMNPublicationRequest{
        title: String!
        type: String!
        subtitle: String
        language: String!
        publicationTime: String!
        additionalDetails: String
        authors: [Authors!]!
        series: Series
        electronicDetails: ElectronicDetailsPublisher
        printDetails: PrintDetails
        mapDetails: MapDetails
    }

    input ISBNISMNPublicationRequestInput{
        title: String!
        type: String!
        subtitle: String
        language: String!
        publicationTime: String!
        additionalDetails: String
        authors: [AuthorsInput!]!
        series: SeriesInput
        electronicDetails: ElectronicDetailsPublisherInput
        printDetails: PrintDetailsInput
        mapDetails: MapDetailsInput
    }


    type Publisher{
        _id: ID!
        name: String!
        language: String!
        metadataDelivery: String!
        primaryContact: [String!]
        email: String
        phone: String
        website: String
        aliases: [String]
        notes: [String]
        activity: Activity
        streetAddress: StreetAddress
        lastUpdated: LastUpdated
    }  

    input PublisherInput{
        name: String!
        language: String!
        metadataDelivery: String!
        primaryContact: [String!]
        email: String
        phone: String
        website: String
        aliases: [String]
        notes: [String]
        activity: ActivityInput
        streetAddress: StreetAddressInput
        lastUpdated: LastUpdatedInput
    }
    
    type PublisherRequest{
        _id: ID!
        state: String!
        publisherId: String
        publicationEstimate: Int!
        primaryContact: [PrimaryContactRequest]!
        name: String!
        language: String!
        metadataDelivery: String!
        email: String
        phone: String
        website: String
        aliases: [String]
        notes: [String]
        activity: Activity
        streetAddress: StreetAddress
        publication: ISBNISMNPublicationRequest
        lastUpdated: LastUpdated
    }

    input PublisherRequestInput{
        state: String!
        publisherId: String
        publicationEstimate: Int!
        primaryContact: [PrimaryContactRequestInput]!
        name: String!
        language: String!
        metadataDelivery: String!
        email: String
        phone: String
        website: String
        aliases: [String]
        notes: [String]
        activity: ActivityInput
        streetAddress: StreetAddressInput
        publication: ISBNISMNPublicationRequestInput    
        lastUpdated: LastUpdatedInput
    }

    type Mutation{
        createPublisher(input: PublisherInput): Publisher!

        updatePublisher(input: PublisherInput): Publisher!

        deletePublisher(_id: ID): Publisher!

        createPublisherRequests(input: PublisherRequestInput): PublisherRequest!

        deletePublisherRequest(_id: ID): PublisherRequest

        updatePublisherRequest(input: PublisherRequestInput): PublisherRequest!
    }
 `;
