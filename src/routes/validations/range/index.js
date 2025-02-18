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

export const validateCreateRangeIsbn = {
  prefix: Joi.number().integer().min(978).max(979).required(),
  langGroup: Joi.number().integer().min(951).max(952).required(),
  category: Joi.number().integer().min(1).max(5).required(),
  rangeBegin: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.numberString).max(5).required(),
  rangeEnd: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.numberString).max(5).required()
};

export const validateCreateRangeIsmn = {
  prefix: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(/^979-0$/u).required(),
  category: Joi.number().integer().min(3).max(7).required(),
  rangeBegin: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.numberString).max(7).required(),
  rangeEnd: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.numberString).max(7).required()
};

export const validateCreateSubRange = {
  publisherId: Joi.number().integer().required(),
  rangeId: Joi.number().integer().required(),
  selectedPublisherIdentifier: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.publisherIdentifierIsbn).required()
};

export const validateCreateRangeIssn = {
  block: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.numberString).min(4).max(4).required(),
  rangeBegin: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.numberString).min(3).max(3).required(),
  rangeEnd: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.numberString).min(3).max(3).required(),
  isActive: Joi.boolean().required()
};
