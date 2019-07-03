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
     userMetadata(id:ID!):User
     usersRequestContent(id:ID!): UsersRequestContent
     Users: [User!]
     UsersRequestContents: [UsersRequestContent!]
 }

 type LastUpdated{
     timestamp: String!
     user: String!
 }
 
 type Preferences{
     defaultLanguage: Language!
 }

 input LastUpdatedInput{
     timestamp: String
     user: String!
 }
 
 input PreferencesInput{
     defaultLanguage: Language!
 }
 
 enum Language{
     eng
     fin
     swe
 }

 enum MetadataDelivery{
     manual
     external
 }

 type UserBase{
     _id: ID!
     publisher: String
     role: [String!]!
     preferences(defaultLanguage: Language): Preferences!
 }

 type UserContent{
    _id: ID!
    givenName: String!
    familyName: String!
    email: String!
    publisher: String
    role: [String!]!
    preferences(defaultLanguage: Language): Preferences!
 }

 type UserContent2{
    _id: ID!
    publisher: String
    role: [String!]!
    preferences(defaultLanguage: Language): Preferences!
    userId: String!
 }

 union UserCreation = UserContent | UserContent2
 
 type User{
    _id: ID!
    givenName: String!
    familyName: String!
    email: String!
    publisher: String
    role: [String!]!
    preferences(defaultLanguage: Language): Preferences!
    notes:[String]
    lastUpdated(timestamp: String, user: String): LastUpdated
 }

 type UsersRequestContent{
     _id: ID!
     state: String!
     rejectionReason: String
     createdResource: String
     givenName: String!
     familyName: String!
     email: String!
     publishers: String
     role:[String!]
    preferences(defaultLanguage: Language): Preferences!
 }

 type UserRequest{
     givenName: String!
     familyName: String!
     email: String!
 }

 input InputUser{
    givenName: String!
    familyName: String!
    email: String!
    publisher: String
    role: [String!]!
    notes:[String]
    preferences: PreferencesInput,
    lastUpdated: LastUpdatedInput
 }

 input InputUserRequestContent{
    state: String!
    rejectionReason: String
    createdResource: String
    givenName: String!
    familyName: String!
    email: String!
    publishers: String
    role:[String!]
    lastUpdated: LastUpdatedInput
 }

 type Mutation{
    createUser(inputUser:InputUser):User!

    createRequest(inputUserRequestContent: InputUserRequestContent):UsersRequestContent!

    deleteUser(id:ID):User

    deleteRequest(id:ID):UsersRequestContent

    updateUser(id:ID, inputUser:InputUser):User!

    updateRequest(id: ID, inputUserRequestContent: InputUserRequestContent):UsersRequestContent!
 }
 `;
