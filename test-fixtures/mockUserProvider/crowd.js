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
import {ApiError, Utils} from '@natlibfi/identifier-services-commons';
import CrowdClient from 'atlassian-crowd-client';
import User from 'atlassian-crowd-client/lib/models/user';
import jose from 'jose';
import fs from 'fs';

import {hasPermission, getTemplate, validateDoc} from '../../src/interfaces/utils';
import interfaceFactory from '../../src/interfaces/interfaceModules';
import {mapRoleToGroup} from '../../src/utils';
import {UI_URL, SMTP_URL} from '../../src/config';

const userInterface = interfaceFactory('userMetadata');
const {sendEmail} = Utils;

export default function ({CROWD_URL, CROWD_APP_NAME, CROWD_APP_PASSWORD, PRIVATE_KEY_URL, db}) {
  const crowdClient = new CrowdClient({
    baseUrl: CROWD_URL,
    application: {
      name: CROWD_APP_NAME,
      password: CROWD_APP_PASSWORD
    }
  });
  return {
    create,
    read,
    update,
    remove,
    changePwd,
    query
  };

  async function create(doc, user) {
    if (Object.keys(doc).length === 0) { // eslint-disable-line functional/no-conditional-statement
      throw new ApiError(HttpStatus.BAD_REQUEST);
    }
    if (doc.email) {
      const newDoc = {...doc, id: doc.email};
      validateDoc(newDoc, 'UserContent');
      if (hasPermission(user, 'users', 'create')) {
        try {
          const {crowdUser} = crowd();
          await crowdUser.create({newDoc});
        } catch (err) {
          throw new ApiError(err.status);
        }
        const filteredDoc = filterDoc(newDoc);
        return userInterface.create(db, filteredDoc, user);
      }
      throw new ApiError(HttpStatus.FORBIDDEN);
    }

    if (doc.userId && !doc.email) {
      const {crowdUser} = crowd();
      const allCrowdUsers = await crowdUser.query();
      const isUserExit = allCrowdUsers.includes(doc.userId);

      if (isUserExit) {
        const newDoc = {...doc, id: doc.userId};
        const filteredDoc = filterDoc(newDoc);
        const queries = [
          {
            query: {id: doc.id}
          }
        ];
        const response = await userInterface.query(db, {queries});
        if (response.results[0].id === doc.id) { // eslint-disable-line functional/no-conditional-statement
          throw new ApiError(HttpStatus.CONFLICT);
        }
        return userInterface.create(db, filteredDoc, user);
      }

      throw new ApiError(HttpStatus.NOT_FOUND);
    }
    function filterDoc(doc) {
      return Object.entries(doc)
        .filter(filter)
        .reduce((acc, [
          key,
          value
        ]) => ({...acc, [key]: value}), {});

      function filter(key) {
        const allowedKeys = [
          'role',
          'givenName',
          'familyName',
          'userId',
          'email'
        ];
        return allowedKeys.includes(key) === false;
      }
    }
  }

  async function read(id, user) {
    const response = await userInterface.read(db, id);
    const {crowdUser} = crowd();
    const result = await crowdUser.read({id: response.userId ? response.userId : response.id});

    if (hasPermission(user, 'users', 'read')) {
      // Need to filter user information after combining and before returning to clientSide
      const filteredDoc = filterDoc(result);
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

  function update(db, id, doc, user) {
    validateDoc(doc, 'UserContent');
    if (hasPermission(user, 'users', update)) {
      return userInterface.update(db, id, doc, user);
    }
    throw new ApiError(HttpStatus.FORBIDDEN);
  }

  async function remove(db, id, user) {
    if (hasPermission(user, 'users', 'remove')) {
      const response = await userInterface.read(db, id);
      if (response) {
        const {crowdUser} = crowd();
        await crowdUser.remove({id: response.userId ? response.userId : response.id});
        return userInterface.remove(db, id);
      }
      throw new ApiError(HttpStatus.NOT_FOUND);
    }
    throw new ApiError(HttpStatus.FORBIDDEN);
  }

  async function changePwd(doc, user) {
    if (doc.newPassword) {
      if (hasPermission(user, 'users', 'changePwd')) {
        const {crowdUser} = crowd();
        return crowdUser.update({doc});
      }
      throw new ApiError(HttpStatus.FORBIDDEN);
    }
    const {crowdUser} = crowd();
    const response = await crowdUser.read({id: doc.id});
    // ************ DO SOMETHING HERE NOT COMLETE ******************
    const email = response.emails[0].value;
    const result = await createLinkAndSendEmail({request: {...doc, email}, PRIVATE_KEY_URL});
    if (result !== undefined && result.status === 404) { // eslint-disable-line functional/no-conditional-statement
      throw new ApiError(HttpStatus.NOT_FOUND);
    }

    return result;
  }

  function query(db, doc, user) {
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
        return userInterface.query(db, {queries, offset});
      }
      return userInterface.query(db, {queries, offset});
    }
    throw new ApiError(HttpStatus.FORBIDDEN);
  }

  function crowd() {
    return {
      crowdUser: {
        read,
        create,
        update,
        remove,
        query
      }

    };

    async function read({id}) {
      const response = await crowdClient.user.get(id);
      return {...response, groups: await getUserGroup(id)};
    }

    async function create({doc}) {
      const payload = new User(
        doc.givenName, doc.familyName,
        `${doc.givenName} ${doc.familyName}`,
        doc.email, doc.email, Math.random()
          .toString(36)
          .slice(2)
      );
      const response = await crowdClient.user.create(payload);
      await crowdClient.user.groups.add(response.email, mapRoleToGroup(doc.role));
      return {...response, groups: await getUserGroup(response.username)};
    }

    async function update({doc}) {
      const userCheckResponse = await crowdClient.user.get(doc.id);
      if (userCheckResponse) {
        return crowdClient.user.password.set(doc.id, doc.newPassword);
      }
    }

    async function remove({id}) {
      const group = await getUserGroup(id);
      await crowdClient.user.groups.remove(id, group);
      return crowdClient.user.remove(id);
    }

    async function query() {
      const users = await crowdClient.search.user('');
      return users;
    }

    async function getUserGroup(id) {
      // Const nestedGroup = await client.user.groups.list(id, 'nested');
      const directGroup = await crowdClient.user.groups.list(id, 'direct');
      // DirectGroup.concat(nestedGroup)
      // Retruning Only direct Group for this project
      return directGroup;
    }
  }

  async function createLinkAndSendEmail({request, PRIVATE_KEY_URL}) {
    const {JWK, JWE} = jose;
    const key = JWK.asKey(fs.readFileSync(PRIVATE_KEY_URL));
    const response = await crowdClient.user.get(request.id);
    if (response) {
      const payload = jose.JWT.sign(request, key, {
        expiresIn: '24 hours',
        iat: true
      });
      const token = JWE.encrypt(payload, key, {kid: key.kid});
      const link = `${UI_URL}/users/passwordReset/${token}`;
      const result = sendEmail({
        name: 'forgot password',
        args: {link},
        getTemplate,

        SMTP_URL,
        API_EMAIL: request.email
      });
      return result;
    }
  }
}
