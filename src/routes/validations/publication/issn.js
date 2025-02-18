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

export const validateCreatePublicationIssn = {
  title: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(200).required(),
  subtitle: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(200),
  placeOfPublication: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(100),
  printer: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(100),
  issuedFromYear: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.yearString),
  issuedFromNumber: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(100),
  frequency: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.issnFrequency),
  frequencyOther: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(50),
  language: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.issnLanguages),
  publicationType: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.issnPublicationType),
  publicationTypeOther: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(50),
  medium: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.issnMedium),
  mediumOther: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(50),
  url: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(100),
  previous: Joi.object({
    title: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(100)).max(5),
    issn: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').regex(regexPatterns.issnNumber)).max(5),
    lastIssue: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50)).max(5)
  }),
  mainSeries: Joi.object({
    title: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(100)).max(5),
    issn: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').regex(regexPatterns.issnNumber)).max(5)
  }),
  subseries: Joi.object({
    title: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(100)).max(5),
    issn: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').regex(regexPatterns.issnNumber)).max(5)
  }),
  anotherMedium: Joi.object({
    title: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(100)).max(5),
    issn: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').regex(regexPatterns.issnNumber)).max(5)
  }),
  additionalInfo: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).max(2000)
};

export const validateUpdatePublicationIssn = {
  title: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(200),
  subtitle: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(200),
  placeOfPublication: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(100),
  printer: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(100),
  issuedFromYear: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').regex(regexPatterns.yearString),
  issuedFromNumber: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(100),
  frequency: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').regex(regexPatterns.issnFrequency),
  frequencyOther: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  language: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.issnLanguages),
  publicationType: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.issnPublicationType),
  publicationTypeOther: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  medium: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.issnMedium),
  mediumOther: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50),
  url: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(100),
  previous: Joi.object({
    title: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(100)).max(5),
    issn: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').regex(regexPatterns.issnNumber)).max(5),
    lastIssue: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(50)).max(5)
  }),
  mainSeries: Joi.object({
    title: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(100)).max(5),
    issn: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').regex(regexPatterns.issnNumber)).max(5)
  }),
  subseries: Joi.object({
    title: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(100)).max(5),
    issn: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').regex(regexPatterns.issnNumber)).max(5)
  }),
  anotherMedium: Joi.object({
    title: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(100)).max(5),
    issn: Joi.array().items(Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').regex(regexPatterns.issnNumber)).max(5)
  }),
  status: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.issnPublicationStatus),
  additionalInfo: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow('').max(2000)
};

export const validateIssnPublicationQueryBody = {
  searchText: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).allow(''),
  limit: Joi.number().integer().min(0),
  offset: Joi.number().integer().min(0),
  status: Joi.string().regex(regexPatterns.utf8mb4, {invert: true}).regex(regexPatterns.issnPublicationStatus),
  formId: Joi.number().integer().min(0),
  publisherId: Joi.number().integer().min(0)
};
