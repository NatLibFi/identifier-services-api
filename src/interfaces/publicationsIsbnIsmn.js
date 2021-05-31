/* eslint-disable no-extra-parens */
/* eslint-disable array-element-newline */
/* eslint-disable no-nested-ternary */
/* eslint-disable max-depth */
/* eslint-disable max-statements */
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

import HttpStatus from 'http-status';
import {ApiError} from '@natlibfi/identifier-services-commons';

import interfaceFactory from './interfaceModules';
import {hasPermission, validateDoc, manageFormatDetails} from './utils';


const publicationsIsbnIsmnInterface = interfaceFactory('Publication_ISBN_ISMN');
const publisherInterface = interfaceFactory('PublisherMetadata');


export default function () {
  return {
    createIsbnIsmn,
    readIsbnIsmn,
    updateIsbnIsmn,
    queryIsbnIsmn,
    queryAllIsbnIsmn
  };

  function createIsbnIsmn(db, doc, user) {
    try {
      if (doc.request) {
        return publicationsIsbnIsmnInterface.create(db, {...doc, metadataReference: addMetadataReference(doc)}, user);
      }
      // Get publisher associate with authenticated user
      if (Object.keys(doc).length === 0) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(HttpStatus.BAD_REQUEST);
      }

      const newDoc = {
        ...doc,
        metadataReference: addMetadataReference(doc),
        publicationType: 'isbn-ismn'
      };

      if (validateDoc(newDoc, 'PublicationIsbnIsmnContent')) {
        if (hasPermission(user, 'publicationIsbnIsmn', 'createIsbnIsmn')) {
          if (user.role === 'publisher') {
            return assignIsbnRange(db, newDoc, user);
          }
          return publicationsIsbnIsmnInterface.create(db, newDoc, user);
        }

        throw new ApiError(HttpStatus.FORBIDDEN);
      }

      throw new ApiError(HttpStatus.BAD_REQUEST);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status ? err.status : HttpStatus.BAD_REQUEST);
      }
    }

    function addMetadataReference(data) {
      const {fileFormat, printFormat, otherFileFormat, otherPrintFormat} = data.formatDetails;
      const allFormats = fileFormat && printFormat
        ? [
          ...fileFormat.format,
          ...printFormat.format
        ]
        : fileFormat
          ? [...fileFormat.format]
          : printFormat && [...printFormat.format];
      otherFileFormat && otherPrintFormat // eslint-disable-line no-unused-expressions
        ? [
          ...Object.values(otherFileFormat),
          ...Object.values(otherPrintFormat)
        ].forEach(v => allFormats.push(v)) // eslint-disable-line functional/immutable-data
        : otherFileFormat
          ? Object.values(otherFileFormat).forEach(v => allFormats.push(v)) // eslint-disable-line functional/immutable-data
          : otherPrintFormat && Object.values(otherFileFormat).forEach(v => allFormats.push(v)); // eslint-disable-line functional/immutable-data
      return allFormats.map(item => { // eslint-disable-line array-callback-return
        if (condition(data.formatDetails, item)) {
          return {
            format: item,
            state: 'pending',
            update: false
          };
        }
      });
    }

    function condition(formatDetails, item) {
      const {fileFormat, printFormat, otherFileFormat, otherPrintFormat} = formatDetails;
      return (
        (fileFormat && fileFormat.format.includes(item)) ||
        (printFormat && printFormat.format.includes(item)) ||
        (otherFileFormat && (otherFileFormat.one === item || otherFileFormat.two === item)) ||
        (otherPrintFormat && (otherPrintFormat.one === item || otherPrintFormat.two === item))
      );
    }
  }

  async function readIsbnIsmn(db, id, user) {
    try {
      const result = await publicationsIsbnIsmnInterface.read(db, id);
      if (hasPermission(user, 'publicationIsbnIsmn', 'readIsbnIsmn')) {
        if (result) {

          if (user.role === 'publisher-admin') {
            if (user.publisher === result.publisher) {
              return result;
            }
            throw new ApiError(HttpStatus.FORBIDDEN);
          }
          return result;
        }
        throw new ApiError(HttpStatus.NOT_FOUND);
      }

      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status);
      }
    }
  }

  function updateIsbnIsmn(db, id, doc, user) {
    try {
      if (Object.keys(doc).length === 0) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(HttpStatus.BAD_REQUEST);
      }
      if (validateDoc(doc, 'PublicationIsbnIsmnContent')) {
        if (hasPermission(user, 'publicationIsbnIsmn', 'updateIsbnIsmn')) {
          return publicationsIsbnIsmnInterface.update(db, id, doc, user);
        }

        throw new ApiError(HttpStatus.FORBIDDEN);
      }

      throw new ApiError(HttpStatus.BAD_REQUEST);
    } catch (err) {
      if (err) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(err.status ? err.status : HttpStatus.BAD_REQUEST);
      }
    }
  }

  /* Async function removeIsbnIsmn(db, id) {
  if (hasAdminPermission(user) || hasSystemPermission(user)) {
    const result = await publicationsIsbnIsmnInterface.remove(db, id);
    return result;
  }

  throw new ApiError(HttpStatus.FORBIDDEN);
  } */

  async function queryIsbnIsmn(db, {queries, sort}, user) {
    if (queries[0].query.identifier) {
      const result = await publicationsIsbnIsmnInterface.queryAllRecords(db, {query: queries[0].query});
      return {
        results: result,
        totalDoc: result.length
      };
    }
    if (user.role === 'publisher') {
      const queries = [
        {
          query: {publisher: user.publisher}
        }
      ];
      return publicationsIsbnIsmnInterface.query(db, {queries});
    }
    const result = await publicationsIsbnIsmnInterface.query(db, {queries, sort});
    if (hasPermission(user, 'publicationIsbnIsmn', 'queryIsbnIsmn')) {
      return result;
    }

    if (user) {
      return result.results.filter(item => item.publisher === user.id);
    }

    throw new ApiError(HttpStatus.FORBIDDEN);
  }

  function queryAllIsbnIsmn(db, {queries}, user) {
    try {
      if (hasPermission(user, 'publicationIsbnIsmn', 'queryIsbnIsmn')) {
        return publicationsIsbnIsmnInterface.queryAllRecords(db, {query: queries[0].query});
      }

      throw new ApiError(HttpStatus.FORBIDDEN);
    } catch (err) {
      throw new ApiError(err);
    }
  }

  async function assignIsbnRange(db, newDoc, user) {
    try {
      const allFormats = manageFormatDetails(newDoc.formatDetails);
      const publisherDetails = await publisherInterface.read(db, newDoc.publisher);
      if (publisherDetails) { // eslint-disable-line functional/no-conditional-statement
        const availableIsbns = publisherDetails.selfPublisherIdentifier;
        const sortedList = availableIsbns.sort((a, b) => Number(a.identifier.replace(/-/gu, '')) - Number(b.identifier.replace(/-/gu, ''))).filter(item => item.free); // eslint-disable-line functional/immutable-data
        const identifier = allFormats.map((item, index) => ({id: sortedList[index].identifier, type: item}));
        const newSortedList = sortedList.map((item, index) => {
          if (index < allFormats.length) {
            return {...item, free: false};
          }
          return item;
        });
        await publisherInterface.update(db, newDoc.publisher, {...publisherDetails, selfPublisherIdentifier: newSortedList}, user);
        return publicationsIsbnIsmnInterface.create(db, {...newDoc, identifier}, user);
      }
    } catch (err) {
      throw new ApiError(err.status ? err.status : HttpStatus.BAD_REQUEST);
    }
  }
}
