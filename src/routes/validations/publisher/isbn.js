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
  officialName: Joi.string().max(100).required(),
  otherNames: Joi.string().allow('').max(200),
  contactPerson: Joi.string().max(100).required(),
  address: Joi.string().max(50).required(),
  zip: Joi.string().max(10).required(),
  city: Joi.string().max(50).required(),
  phone: Joi.string().max(30).required(),
  email: Joi.string().regex(regexPatterns.email).max(100).required(),
  www: Joi.string().allow('').max(100),
  langCode: Joi.string().regex(regexPatterns.langCode).required(),
  frequencyCurrent: Joi.string().allow('').max(50),
  frequencyNext: Joi.string().allow('').max(50),
  affiliateOf: Joi.string().allow('').max(50),
  affiliates: Joi.string().allow('').max(200),
  distributorOf: Joi.string().allow('').max(200),
  distributors: Joi.string().allow('').max(50),
  classification: Joi.array().items(Joi.string().max(6)).max(5),
  classificationOther: Joi.string().allow('').max(50),
  turnstileToken: Joi.string()
};

// Note: in update operation no fields are required
// one can update only the desired value
export const validateUpdatePublisherRequestIsbn = {
  officialName: Joi.string().max(100),
  otherNames: Joi.string().allow('').max(200),
  previousNames: Joi.array().items(Joi.string().max(40)).max(7),
  contactPerson: Joi.string().allow('').max(100),
  address: Joi.string().allow('').max(50),
  addressLine1: Joi.string().allow('').max(50),
  zip: Joi.string().allow('').max(10),
  city: Joi.string().allow('').max(50),
  phone: Joi.string().allow('').max(30),
  email: Joi.string().allow('').max(100),
  www: Joi.string().allow('').max(100),
  langCode: Joi.string().regex(regexPatterns.langCode),
  additionalInfo: Joi.string().allow('').max(2000),
  frequencyCurrent: Joi.string().allow('').max(50),
  frequencyNext: Joi.string().allow('').max(50),
  affiliateOf: Joi.string().allow('').max(50),
  affiliates: Joi.string().allow('').max(200),
  distributorOf: Joi.string().allow('').max(200),
  distributors: Joi.string().allow('').max(50),
  classification: Joi.array().items(Joi.string().max(6)).max(5),
  classificationOther: Joi.string().allow('').max(50),
  yearQuitted: Joi.number().integer().min(1800).max(2123),
  hasQuitted: Joi.boolean(),
  promoteSorting: Joi.boolean()
};

// Distinction between admin-only and public attributes is done in publisher->query interface function
export const validateIsbnPublisherQueryBody = {
  searchText: Joi.string().allow(''),
  hasQuitted: Joi.boolean(),
  category: Joi.number().integer().min(1).max(7),
  identifierType: Joi.string().regex(/^ISBN$|^ISMN$/u),
  limit: Joi.number().integer().min(0).max(50),
  offset: Joi.number().integer().min(0)
};

export const validateIsbnRegistryPublisherArchiveQuery = {
  publisherId: Joi.number().integer().required()
};
