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

export const validateCreatePublisherRequestIsbn = {
  officialName: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(100).required(),
  otherNames: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(200),
  contactPerson: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(100).required(),
  address: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(50).required(),
  zip: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(10).required(),
  city: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(50).required(),
  phone: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(30).required(),
  email: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.email).max(100).required(),
  www: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(100),
  langCode: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.langCode).required(),
  frequencyCurrent: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  frequencyNext: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  affiliateOf: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  affiliates: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(200),
  distributorOf: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(200),
  distributors: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  classification: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(6)).max(5),
  classificationOther: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  turnstileToken: Joi.string().regex(regexPatterns.utf8mb4, {invert: true})
};

// Note: in update operation no fields are required
// one can update only the desired value
export const validateUpdatePublisherRequestIsbn = {
  officialName: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(100),
  otherNames: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(200),
  previousNames: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(40)).max(7),
  contactPerson: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(100),
  address: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  addressLine1: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  zip: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(10),
  city: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  phone: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(30),
  email: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(100),
  www: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(100),
  langCode: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.langCode),
  additionalInfo: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(2000),
  frequencyCurrent: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  frequencyNext: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  affiliateOf: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  affiliates: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(200),
  distributorOf: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(200),
  distributors: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  classification: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(6)).max(5),
  classificationOther: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  yearQuitted: Joi.number().integer().min(1800).max(2123),
  hasQuitted: Joi.boolean(),
  promoteSorting: Joi.boolean()
};

// Distinction between admin-only and public attributes is done in publisher->query interface function
export const validateIsbnPublisherQueryBody = {
  searchText: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow(''),
  hasQuitted: Joi.boolean(),
  category: Joi.number().integer().min(1).max(7),
  identifierType: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(/^ISBN$|^ISMN$/u),
  limit: Joi.number().integer().min(0).max(50),
  offset: Joi.number().integer().min(0)
};

export const validateIsbnRegistryPublisherArchiveQuery = {
  publisherId: Joi.number().integer().required()
};

export const validateIsbnRegistryPublisherEmailDownloadQueryBody = {
  identifierType: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(/^ISBN$|^ISMN$/u),
  category: Joi.number().integer().min(1).max(7),
  format: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(/^txt$|^json$/u),
  langCode: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.langCode)
};

export const validateIsbnRegistryPublisherGetInformationPackageQueryBody = {
  publisherId: Joi.number().integer().required(),
  format: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(/^json$|^xlsx$/u).required()
};
