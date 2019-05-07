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

        Publishers:[Publisher!]!        

        publisherRequest(id: String, name:String, publisherId: String, language: String, email: String, website: String,
            publicationEstimate: Int, state: String, address: String, city: String, zip: String, 
            givenName: String, familyName: String, emailContact: String ): PublisherRequest


    }

    type LastUpdated{
        timeStamp: String!
        user: String!
    }



    type Activity{
        active: Boolean
        yearInactivated: Int
    }

    type StreetAddress{
        address: String!
        city: String!
        zip: String!
    }




    type UserId{
        userId: String
    }

    type Email {
        email: String
    }

 

    type PrimaryContactRequest{
        givenName: String!
        familyName: String!
        email: String!
    }

    type ISBN_ISMN{
        name: String
    }
    type ISSN {
        name: String
    }

    enum Publication{
        ISBN_ISMN
        ISSN
    }

    type Publisher{
        id: String!
        lastUpdated: LastUpdated
        name: String!
        language: String!
        metadataDelivery: String!
        primaryContact: [String!]!
        email: String
        phone: String
        website: String
        aliases: [String]
        notes: [String]
        activity: Activity
        streetAddress: StreetAddress
    }  
    
    type PublisherRequest{
        id: String!
        name: String!
        publisherId: String!
        language: String!
        email: String
        website: String
        publicationEstimate: Int!
        state: String!
        streetAddress(address: String, city: String, zip: String): StreetAddress
        primaryContact: [PrimaryContactRequest]
        publication: Publication
    }

    type Mutation{
        createPublisher(
            id: String,
            timestamp: String,
            user: String
            name: String,
            language: String,
            metadataDelivery: String,
            primaryContact: String
            email: String,
            phone: String,
            website: String,
            aliases: String,
            notes: String,
            active: Boolean,
            yearInactivated: Int,
            address: String,
            city: String,
            zip: String
        ): Publisher

        updatePublisher(
            id: String,
            timestamp: String,
            user: String
            name: String,
            language: String,
            metadataDelivery: String,
            primaryContact: String
            email: String,
            phone: String,
            website: String,
            aliases: String,
            notes: String,
            active: Boolean,
            yearInactivated: Int,
            address: String,
            city: String,
            zip: String
        ): Publisher

        deletePublisher(
            id: String
        ): Publisher
    }
 `;
