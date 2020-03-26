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
import fs from 'fs';

import {hasPermission, createLinkAndSendEmail, validateDoc} from '../interfaces/utils';
import interfaceFactory from '../interfaces/interfaceModules';
import {formatUrl, mapGroupToRole, checkRoleInGroup, mapRoleToGroup} from '../utils';

const userMetadataInterface = interfaceFactory('userMetadata');
const usersRequestInterface = interfaceFactory('usersRequest');

export default function ({PASSPORT_LOCAL_USERS, PRIVATE_KEY_URL, db}) {
  return {
    create,
    read,
    update,
    remove,
    changePwd,
    query,
    createRequest,
    readRequest,
    updateRequest,
    removeRequest,
    queryRequest
  };

  async function create(doc, user) {
    let isUserExit;// eslint-disable-line functional/no-let
    if (Object.keys(doc).length === 0) { // eslint-disable-line functional/no-conditional-statement
      throw new ApiError(HttpStatus.BAD_REQUEST);
    } else {
      if (doc.email) {
        const newDoc = {...doc, id: doc.email};
        validateDoc(newDoc, 'UserContent');
        if (hasPermission(user, 'users', 'create')) {
          try {
            const {localUser} = local();
            await localUser.create({PASSPORT_LOCAL_USERS, doc: newDoc});
          } catch (err) {
            throw new ApiError(err.status);
          }
          const filteredDoc = filterDoc(newDoc);
          return userMetadataInterface.create(db, filteredDoc, user);
        }
        throw new ApiError(HttpStatus.FORBIDDEN);
      }

      if (doc.userId && !doc.email) {
        const {localUser} = local();
        const allLocalUsers = await localUser.query({PASSPORT_LOCAL_USERS});
        if (allLocalUsers.some(item => item.id === doc.userId)) {
          const newLocalUsers = allLocalUsers.map(item => {
            if (!checkRoleInGroup(item.groups)) {
              return item.groups.concat(mapRoleToGroup(doc.role));
            }
            return item;
          });

          fs.writeFileSync(formatUrl(PASSPORT_LOCAL_USERS), JSON.stringify(newLocalUsers, null, 4), 'utf-8');
          isUserExit = true;
          return;
        }
      }

      if (isUserExit) {
        const newDoc = {...doc, id: doc.userId};
        const filteredDoc = filterDoc(newDoc);
        const queries = [
          {
            query: {id: doc.id}
          }
        ];
        const response = await userMetadataInterface.query(db, {queries});
        if (response.results[0].id === doc.id) { // eslint-disable-line functional/no-conditional-statement
          throw new ApiError(HttpStatus.CONFLICT);
        }
        return userMetadataInterface.create(db, filteredDoc, user);
      }
      if (!doc.userId && !doc.email) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(HttpStatus.BAD_REQUEST);
      }
      throw new ApiError(HttpStatus.NOT_FOUND);
    }
    function filterDoc(doc) {
      return Object.entries(doc)
        .filter(([key]) => key === 'role' === false)
        .filter(([key]) => key === 'givenName' === false)
        .filter(([key]) => key === 'familyName' === false)
        .filter(([key]) => key === 'userId' === false)
        .filter(([key]) => key === 'email' === false)
        .reduce((acc, [
          key,
          value
        ]) => ({...acc, [key]: value}), {});
    }
  }

  async function read(id, user) {
    const response = await userMetadataInterface.read(db, id);
    const {localUser} = local();
    const result = await localUser.read({PASSPORT_LOCAL_USERS, value: response.userId ? response.userId : response.id}); // Delete id later
    const newResult = {...result, role: mapGroupToRole(result.groups)};

    if (hasPermission(user, 'users', 'read')) {
      // Need to filter user information after combining and before returning to clientSide
      const filteredDoc = filterDoc(newResult);
      if (user.role === 'publisher-admin') {
        if (user.id === filteredDoc.publisher || user.id === filteredDoc.id) {
          return {...response, ...filteredDoc};
        }
        throw new ApiError(HttpStatus.UNAUTHORIZED);
      }
      return {...response, ...filteredDoc};
    }
    throw new ApiError(HttpStatus.FORBIDDEN);
    function filterDoc(doc) {
      return Object.entries(doc)
        .filter(([key]) => key === 'password' === false)
        .reduce((acc, [
          key,
          value
        ]) => ({...acc, [key]: value}), {});
    }
  }

  function update(id, doc, user) {
    validateDoc(doc, 'UserContent');
    if (hasPermission(user, 'users', update)) {
      try {
        const {localUser} = local();
        localUser.update({PASSPORT_LOCAL_USERS, doc});
      } catch (err) {
        throw new ApiError(err.status);
      }
      const filteredDoc = filterDoc(doc);
      return userMetadataInterface.update(db, id, filteredDoc, user);
    }
    throw new ApiError(HttpStatus.FORBIDDEN);
    function filterDoc(doc) {
      return Object.entries(doc)
        .filter(([key]) => key === 'role' === false)
        .filter(([key]) => key === 'givenName' === false)
        .filter(([key]) => key === 'familyName' === false)
        .filter(([key]) => key === '_id' === false)
        .filter(([key]) => key === 'userId' === false)
        .filter(([key]) => key === 'email' === false)
        .reduce((acc, [
          key,
          value
        ]) => ({...acc, [key]: value}), {});
    }
  }

  async function remove(id, user) {
    if (hasPermission(user, 'users', 'remove')) {
      const response = await userMetadataInterface.read(db, id);
      if (response === null) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(HttpStatus.NOT_FOUND);
      } else {
        const {localUser} = local();
        await localUser.remove({PASSPORT_LOCAL_USERS, id: response.userId ? response.userId : response.id});
        return userMetadataInterface.remove(db, id);
      }
    }
    throw new ApiError(HttpStatus.FORBIDDEN);
  }

  async function changePwd(doc, user) {
    if (doc.newPassword) {
      if (hasPermission(user, 'users', 'changePwd')) {
        const {localUser} = local();
        return localUser.update({PASSPORT_LOCAL_USERS, user: doc});
      }
      throw new ApiError(HttpStatus.FORBIDDEN);
    }
    const {localUser} = local();
    const response = await localUser.read({PASSPORT_LOCAL_USERS, value: doc.id});
    const email = response.emails[0].value;
    const result = await createLinkAndSendEmail({request: {...doc, email}, PRIVATE_KEY_URL, PASSPORT_LOCAL_USERS});
    if (result !== undefined && result.status === 404) { // eslint-disable-line functional/no-conditional-statement
      throw new ApiError(HttpStatus.NOT_FOUND);
    }

    return result;
  }

  function query(doc, user) {
    if (Object.keys(doc).length === 0) { // eslint-disable-line functional/no-conditional-statement
      throw new ApiError(HttpStatus.BAD_REQUEST);
    }
    const {queries, offset} = doc;
    if (hasPermission(user, 'users', 'query')) {
      if (user.role === 'publisher-admin') {
        const queries = [
          {
            query: {publisher: user.publisher}
          }
        ];
        return userMetadataInterface.query(db, {queries, offset});
      }
      return userMetadataInterface.query(db, {queries, offset});
    }
    throw new ApiError(HttpStatus.FORBIDDEN);
  }

  async function createRequest(doc, user) {
    let isUserExist;// eslint-disable-line functional/no-let
    if (Object.keys(doc).length === 0) { // eslint-disable-line functional/no-conditional-statement
      throw new ApiError(HttpStatus.UNPROCESSABLE_ENTITY);
    }
    if (doc.userId && !doc.email) {
      const {localUser} = local();
      const allLocalUsers = await localUser.query({PASSPORT_LOCAL_USERS});
      isUserExist = allLocalUsers.some(item => item.id === doc.userId);

      if (isUserExist) {
        const response = await checkDuplication(usersRequestInterface);
        if (response.results.length > 0 && doc.userId === response.results[0].userId) { // eslint-disable-line functional/no-conditional-statement
          throw new ApiError(HttpStatus.CONFLICT);
        }
        return formatUserAndCreate();
      }

      throw new ApiError(HttpStatus.NOT_FOUND);
    }

    if (doc.email) { // eslint-disable-line functional/no-conditional-statement
      const {localUser} = local();
      const allLocalUsers = await localUser.query({PASSPORT_LOCAL_USERS});
      isUserExist = allLocalUsers.some(item => item.id === doc.email);
    }

    const response = await checkDuplication(usersRequestInterface);
    const checkUser = response.results.length > 0 && doc.email === response.results[0].id;
    if (isUserExist || checkUser) { // eslint-disable-line functional/no-conditional-statement
      throw new ApiError(HttpStatus.CONFLICT);
    } else {
      return formatUserAndCreate();
    }


    async function checkDuplication(interfaceName) {
      const queries = [
        {
          query: {$or: [
            {id: doc.email ? doc.email : doc.userId},
            {userId: doc.userId ? doc.userId : doc.email}
          ]}
        }
      ];
      const response = await interfaceName.query(db, {queries});
      return response;
    }

    function formatUserAndCreate() {
      if (hasPermission(user, 'userRequests', 'createRequest')) {
        const newDoc = {
          ...doc,
          state: 'new',
          backgroundProcessingState: 'pending',
          preferences: {
            defaultLanguage: 'fin'
          },
          role: 'publisher',
          userId: doc.userId ? doc.userId : doc.email,
          creator: user.id,
          publisher: user.publisher
        };
        validateDoc(newDoc, 'UserRequestContent');
        return usersRequestInterface.create(db, newDoc, user);
      }

      throw new ApiError(HttpStatus.FORBIDDEN);
    }
  }

  async function readRequest(id, user) {
    const protectedProperties = user.role === 'publisher-admin' ? {_id: 0, state: 0} : {_id: 0};
    const result = await usersRequestInterface.read(db, id, protectedProperties);
    if (hasPermission(user, 'userRequests', 'readRequest')) {
      if (user.role === 'publisher-admin') {
        if (result.creator === user.id || user.publisher === result.publishers) {
          return result;
        }

        throw new ApiError(HttpStatus.UNAUTHORIZED);
      }

      return result;
    }

    throw new ApiError(HttpStatus.FORBIDDEN);
  }

  function updateRequest(id, doc, user) {
    const newDoc = {...doc, backgroundProcessingState: doc.backgroundProcessingState ? doc.backgroundProcessingState : 'pending'};
    if (newDoc.initialRequest) { // eslint-disable-line functional/no-conditional-statement
      const filteredDoc = filterDoc(newDoc);
      validateDoc(filteredDoc, 'UserRequestContent');
      if (hasPermission(user, 'userRequests', 'updateRequest')) {
        return usersRequestInterface.update(db, id, filteredDoc, user);
      }
    }
    if (hasPermission(user, 'userRequests', 'updateRequest')) {
      return usersRequestInterface.update(db, id, newDoc, user);
    }
    throw new ApiError(HttpStatus.FORBIDDEN);
    function filterDoc(doc) {
      return Object.entries(doc)
        .filter(([key]) => key === 'initialRequest' === false)
        .reduce((acc, [
          key,
          value
        ]) => ({...acc, [key]: value}), {});
    }
  }

  async function removeRequest(id, user) {
    if (hasPermission(user, 'userRequests', 'removeRequest')) {
      const result = await usersRequestInterface.remove(db, id);
      if (result.value === null) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(HttpStatus.NOT_FOUND);
      } else {
        return result;
      }
    }

    throw new ApiError(HttpStatus.FORBIDDEN);
  }

  async function queryRequest(doc, user) {
    if (Object.keys(doc).length === 0) { // eslint-disable-line functional/no-conditional-statement
      throw new ApiError(HttpStatus.BAD_REQUEST);
    } else {
      const {queries, offset} = doc;
      const result = await usersRequestInterface.query(db, {queries, offset});
      if (hasPermission(user, 'userRequests', 'queryRequest')) {
        if (user.role === 'publisher-admin') {
          const queries = [
            {
              query: {publisher: user.publisher}
            }
          ];
          const protectedProperties = {state: 0};
          const response = await usersRequestInterface.query(db, {queries, offset}, protectedProperties);
          return response;
        }
        return result;
      }
      throw new ApiError(HttpStatus.FORBIDDEN);
    }
  }

  function local() {
    return {
      localUser: {
        create,
        read,
        update,
        remove,
        query
      }
    };
    function create({PASSPORT_LOCAL_USERS, doc}) {
      const res = fs.readFileSync(formatUrl(PASSPORT_LOCAL_USERS), 'utf-8');
      const data = JSON.parse(res);
      const newData = {
        id: doc.email,
        password: Math.random().toString(36)
          .slice(2),
        name: {
          givenName: doc.givenName,
          familyName: doc.familyName
        },
        displayName: `${doc.givenName}${doc.familyName}`,
        emails: [{value: doc.email, type: 'work'}],
        organization: [],
        groups: [mapRoleToGroup(doc.role)]
      };
      if (containsObject(newData, data)) { // eslint-disable-line functional/no-conditional-statement
        throw new ApiError(HttpStatus.CONFLICT);
      }

      data.concat(newData);
      fs.writeFileSync(formatUrl(PASSPORT_LOCAL_USERS), JSON.stringify(data, null, 4), 'utf-8');
      return null;
      function containsObject(obj, list) {
        return list.some(item => item.id === obj.id);
      }
    }

    function read({PASSPORT_LOCAL_USERS, value}) {
      const res = fs.readFileSync(formatUrl(PASSPORT_LOCAL_USERS), 'utf-8');
      const data = JSON.parse(res);
      const index = 0;
      const user = data.filter(item => item.id === value)[index];
      return user;
    }

    function update({PASSPORT_LOCAL_USERS, doc}) {
      const {id, newPassword} = doc;
      const readResponse = fs.readFileSync(formatUrl(PASSPORT_LOCAL_USERS), 'utf-8');
      const passportLocalList = JSON.parse(readResponse);
      const newPassportLocalList = passportLocalList.map(passport => {
        if (newPassword && passport.id === id) {
          return {...passport, password: newPassword};
        }
        return passport;
      });

      fs.writeFileSync(formatUrl(PASSPORT_LOCAL_USERS), JSON.stringify(newPassportLocalList, null, 4), 'utf-8');
      return HttpStatus.OK;
    }

    function remove({PASSPORT_LOCAL_USERS, id}) {
      const readResponse = fs.readFileSync(formatUrl(PASSPORT_LOCAL_USERS), 'utf-8');
      const passportLocalList = JSON.parse(readResponse);
      const result = passportLocalList.filter(item => item.id !== id);
      fs.writeFileSync(formatUrl(PASSPORT_LOCAL_USERS), JSON.stringify(result, null, 4), 'utf-8');
      return HttpStatus.OK;
    }

    function query({PASSPORT_LOCAL_USERS}) {
      const readResponse = fs.readFileSync(formatUrl(PASSPORT_LOCAL_USERS), 'utf-8');
      const passportLocalList = JSON.parse(readResponse);
      const result = passportLocalList.map(item => item);
      return result;
    }
  }
}
