/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * API service of Identifier Services system
 *
 * Copyright (C) 2023 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of identifier-services-api
 *
 * identifier-services-api program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * identifier-services-api is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 */

import {Joi} from 'celebrate';
import regexPatterns from '../patterns';

export const validateCreatePublicationRequestIsbn = {
  officialName: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(100).required(),
  publisherIdentifierStr: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(20),
  locality: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  address: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(50).required(),
  zip: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(10).required(),
  city: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(50).required(),
  contactPerson: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(100).required(),
  phone: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(30).required(),
  email: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.email).max(100).required(),
  langCode: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.langCode).required(),
  publishedBefore: Joi.boolean(),
  publicationsPublic: Joi.boolean().invalid(false).required(),
  publishingActivity: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publishingActivity),
  publishingActivityAmount: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(5),
  publicationType: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publicationType).required(),
  publicationFormat: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publicationFormat).required(),
  firstName1: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(50).required(),
  lastName1: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(50).required(),
  role1: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.authorRoles)).max(4).required(),
  firstName2: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(50),
  lastName2: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(50),
  role2: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.authorRoles)).max(4),
  firstName3: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(50),
  lastName3: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(50),
  role3: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.authorRoles)).max(4),
  firstName4: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(50),
  lastName4: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(50),
  role4: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.authorRoles)).max(4),
  title: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(200).required(),
  subtitle: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(200),
  mapScale: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  language: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publicationLanguage).required(),
  year: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.yearString).required(),
  month: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.monthString).required(),
  series: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(200),
  issn: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publicationIssn),
  volume: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(20),
  printingHouse: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(100),
  printingHouseCity: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  copies: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(10),
  edition: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publicationEditionString),
  type: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publicationPrintType)).max(4),
  typeOther: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(100),
  comments: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(2000),
  fileformat: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publicationElectronicalType)).max(4),
  fileformatOther: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(100),
  turnstileToken: Joi.string().regex(regexPatterns.utf8mb4, {invert: true})
};

export const validateCreatePublicationRequestIsbnAdmin = {
  officialName: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(100).required(),
  address: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50).required(),
  zip: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(10).required(),
  city: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50).required(),
  contactPerson: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(100).required(),
  phone: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(30).required(),
  email: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').regex(regexPatterns.email).max(100).required(),
  langCode: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.langCode).required(),
  publicationsPublic: Joi.boolean().invalid(false).required(),
  publishingActivity: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publishingActivity),
  publicationType: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publicationType).required(),
  publicationFormat: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publicationFormat).required(),
  firstName1: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(50).required(),
  lastName1: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(50).required(),
  role1: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.authorRoles)).max(4).required(),
  title: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(200).required(),
  subtitle: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(200),
  language: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publicationLanguage).required(),
  year: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.yearString).required(),
  month: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.monthString).required(),
  type: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publicationPrintType)).max(4),
  fileformat: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publicationElectronicalType)).max(4)
};

export const validateUpdatePublicationRequestIsbn = {
  officialName: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(100),
  publisherIdentifierStr: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(20),
  locality: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  address: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  zip: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(10),
  city: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  contactPerson: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(100),
  phone: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(30),
  email: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(100),
  langCode: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.langCode),
  publishedBefore: Joi.boolean(),
  publicationsPublic: Joi.boolean(),
  publishingActivity: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publishingActivity),
  publishingActivityAmount: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(5),
  publicationType: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publicationType),
  publicationFormat: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publicationFormat),
  firstName1: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(50),
  lastName1: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(50),
  role1: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.authorRoles)).max(4),
  firstName2: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  lastName2: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  role2: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.authorRoles)).max(4),
  firstName3: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  lastName3: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  role3: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.authorRoles)).max(4),
  firstName4: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  lastName4: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  role4: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.authorRoles)).max(4),
  title: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(200),
  subtitle: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(200),
  mapScale: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  language: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publicationLanguage),
  year: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.yearString),
  month: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.monthString),
  series: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(200),
  issn: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').regex(regexPatterns.publicationIssn),
  volume: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(20),
  printingHouse: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(100),
  printingHouseCity: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  copies: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(10),
  edition: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').regex(regexPatterns.publicationEditionString),
  type: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publicationPrintType)).max(4),
  typeOther: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(100),
  comments: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(2000),
  fileformat: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publicationElectronicalType)).max(4),
  fileformatOther: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(100),
  // Update only attributes
  publicationsIntra: Joi.boolean(),
  noIdentifierGranted: Joi.boolean(),
  onProcess: Joi.boolean()
};


export const validateSetPublisher = {
  publisherId: Joi.number().integer().allow(null).required()
};

export const validateQueryPublicationRequestIsbn = {
  searchText: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow(''),
  limit: Joi.number().integer().min(0),
  offset: Joi.number().integer().min(0),
  state: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publicationState),
  publisherId: Joi.number().integer().min(0)
};
