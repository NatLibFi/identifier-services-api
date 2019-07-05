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
    messageTemplate(id:ID!): MessageTemplate
    MessageTemplates: [MessageTemplate]
    messageTemplateContent(id:ID!): MessageTemplateContent
    MessageTemplatesContent: [MessageTemplateContent]
}

type MessageTemplate{
    _id: ID!
    name:String!
    language: String!
    subject: String!
    body: String!
    notes: [String]
    lastUpdated: LastUpdated!
}

type MessageTemplateContent{
    _id: ID!
    name:String!
    language: String!
    subject: String!
    body: String!
}

input InputMessageTemplate{
    name:String!
    language:String!
    subject:String!
    body:String!
    lastUpdated: LastUpdatedInput
}
input InputMessageTemplateContent{
    name:String!
    language:String!
    subject:String!
    body:String!
}

type Mutation{
    createTemplate(inputMessageTemplate:InputMessageTemplate):MessageTemplate!
    updateTemplate(id:ID, inputMessageTemplate: InputMessageTemplate):MessageTemplate
    deleteTemplate(id:ID):MessageTemplate
    createTemplateContent(inputMessageTemplateContent:InputMessageTemplateContent):MessageTemplateContent!
    updateTemplateContent(id:ID, inputMessageTemplateContent: InputMessageTemplateContent):MessageTemplateContent
    deleteTemplateContent(id:ID):MessageTemplateContent
}
`;
