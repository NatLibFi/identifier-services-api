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
import {validateCreatePublicationIssn} from '../publication/issn';


const formCreateObject = {
  publisher: Joi.string().max(100).required(),
  contactPerson: Joi.string().allow('').max(100).required(),
  email: Joi.string().allow('').regex(regexPatterns.email).max(100).required(),
  phone: Joi.string().allow('').max(30),
  address: Joi.string().allow('').max(50).required(),
  zip: Joi.string().allow('').max(10).required(),
  city: Joi.string().allow('').max(50).required(),
  langCode: Joi.string().regex(regexPatterns.langCode).required()
};

export const validateCreateIssnRequest = {
  form: Joi.object(formCreateObject).required(),
  publications: Joi.array().items(Joi.object(validateCreatePublicationIssn)).min(1).max(4).required(),
  turnstileToken: Joi.string()
};

export const validateUpdateIssnRequest = {
  publisher: Joi.string().max(100),
  contactPerson: Joi.string().max(100).allow(''),
  email: Joi.string().regex(regexPatterns.email).allow('').max(100),
  phone: Joi.string().allow('').max(30),
  address: Joi.string().allow('').max(50),
  zip: Joi.string().allow('').max(10),
  city: Joi.string().allow('').max(50),
  langCode: Joi.string().regex(regexPatterns.langCode),
  status: Joi.string().regex(regexPatterns.issnRequestStatus)
};

export const validateQueryIssnRequest = {
  searchText: Joi.string().allow(''),
  limit: Joi.number().integer().min(0),
  offset: Joi.number().integer().min(0),
  status: Joi.string().regex(regexPatterns.issnRequestStatus),
  publisherId: Joi.number().integer().min(0)
};

export const validateIssnArchiveSearch = {
  formId: Joi.number().integer().required()
};
