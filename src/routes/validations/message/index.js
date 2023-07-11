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

import {MESSAGE_TYPE_CONFIG_ISBN, MESSAGE_TYPE_CONFIG_ISSN} from '../../../config';

export const validateCreateMessageType = {
  name: Joi.string().max(50).required(),
  description: Joi.string().max(200).required()
};

export const validateUpdateMessageType = {
  name: Joi.string().max(50),
  description: Joi.string().allow('').max(200)
};

export const validateCreateMessageTemplate = {
  messageTypeId: Joi.number().integer().required(),
  name: Joi.string().max(50).required(),
  subject: Joi.string().max(150).required(),
  langCode: Joi.string().regex(regexPatterns.langCode).required(),
  message: Joi.string().max(65000).required()
};

export const validateUpdateMessageTemplate = {
  messageTypeId: Joi.number().integer(),
  name: Joi.string().max(50),
  subject: Joi.string().max(150),
  langCode: Joi.string().regex(regexPatterns.langCode),
  message: Joi.string().max(65000)
};

export const validateQueryMessageIsbn = {
  publisherId: Joi.number().integer(),
  publicationId: Joi.number().integer(),
  searchText: Joi.string().allow(''),
  offset: Joi.number().integer(),
  limit: Joi.number().integer()
};

export const validateQueryMessageIssn = {
  publisherId: Joi.number().integer(),
  formId: Joi.number().integer(),
  searchText: Joi.string().allow(''),
  offset: Joi.number().integer(),
  limit: Joi.number().integer()
};

export const validateLoadTemplateIsbn = {
  // Code must be one mapped to a desired message type in env config
  code: Joi.string().valid(...Object.keys(MESSAGE_TYPE_CONFIG_ISBN)).required(),
  publisherId: Joi.number().integer().required(),
  publicationId: Joi.number().integer(),
  identifierBatchId: Joi.number().integer()
};

export const validateLoadTemplateIssn = {
  // Code must be one mapped to a desired message type in env config
  code: Joi.string().valid(...Object.keys(MESSAGE_TYPE_CONFIG_ISSN)).required(),
  publisherId: Joi.number().integer().required(),
  formId: Joi.number().integer()
};

export const validateSendMessageIsbn = {
  publisherId: Joi.number().integer().required(),
  publicationId: Joi.number().integer(),
  messageTemplateId: Joi.number().integer().required(),
  batchId: Joi.number().integer(),
  langCode: Joi.string().regex(regexPatterns.langCode).required(),
  recipient: Joi.string().regex(regexPatterns.email).required(),
  subject: Joi.string().required(),
  messageBody: Joi.string().required()
};

export const validateSendMessageIssn = {
  publisherId: Joi.number().integer().required(),
  formId: Joi.number().integer(),
  messageTemplateId: Joi.number().integer().required(),
  langCode: Joi.string().regex(regexPatterns.langCode).required(),
  recipient: Joi.string().regex(regexPatterns.email).required(),
  subject: Joi.string().required(),
  messageBody: Joi.string().required()
};

export const validateResendMessage = {
  recipient: Joi.string().regex(regexPatterns.email).required()
};
