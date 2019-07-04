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

enum FileFormat{
    pdf
    epub
    cd
}
enum PrintFormat{
    paperback
    hardback
    spiralBinding
    orderedMap
}

enum Format{
    cd
    electronic
    printed
    printedAndelectronic
}

enum State{
    new
    pending
    inProgress
    processed
    accepted
    rejected
}
enum BackgroundProcessingState{
    pending
    inProgress
    processed
}
enum Type{
    book
    dissertation
    music
    other
    map
}
enum Role{
    admin
    publisherAdmin
    publisher
    system
}
enum Frequency{
    daily
    weekly
    biMonthly
    monthly
    quarterly
    biYearly
    yearly
    continuously
    irregularly
}
enum IssnType{
    journal
    newsletter
    staffMagazine
    membershipMagazine
    cartoon
    newspaper
    freepaper
    monography
}

 type UserBase{
     _id: ID!
     publisher: String
     role: [Role]!
     preferences(defaultLanguage: Language): Preferences!
 }

 type UserContent{
    _id: ID!
    givenName: String!
    familyName: String!
    email: String!
    publisher: String
    role: [Role]!
    preferences(defaultLanguage: Language): Preferences!
 }

 type UserContent2{
    _id: ID!
    publisher: String
    role: [Role]!
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
    role: [Role]!
    preferences(defaultLanguage: Language): Preferences!
    notes:[String]
    lastUpdated(timestamp: String, user: String): LastUpdated
 }
 input UserInput{
    givenName: String!
    familyName: String!
    email: String!
    publisher: String
    role: [Role]!
    notes:[String]
    preferences: PreferencesInput
    lastUpdated: LastUpdatedInput
 }

 type UsersRequestContent{
    _id: ID!
    backgroundProcessingState: BackgroundProcessingState
    state: State!
    rejectionReason: String
    createdResource: String
    givenName: String!
    familyName: String!
    email: String!
    publishers: String
    role: [Role]!
    preferences(defaultLanguage: Language): Preferences!
 }

 type UserRequest{
    givenName: String!
    familyName: String!
    email: String!
 }

 input UserRequestContentInput{
    state: String!
    rejectionReason: String
    createdResource: String
    givenName: String!
    familyName: String!
    email: String!
    publishers: String
    role: [Role]!
    lastUpdated: LastUpdatedInput
 }

 type Mutation{
    createUser(inputUser:UserInput):User!

    createRequest(UserRequestContentInput: UserRequestContentInput):UsersRequestContent!

    deleteUser(id:ID):User

    deleteRequest(id:ID):UsersRequestContent

    updateUser(id:ID, inputUser:UserInput):User!

    updateRequest(id: ID, UserRequestContentInput: UserRequestContentInput):UsersRequestContent!
 }
 `;
