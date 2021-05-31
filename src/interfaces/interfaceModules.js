/* eslint-disable max-statements */
/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * API microservice of Melinda record batch import system
 *
 * Copyright (C) 2018-2019 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of melinda-record-import-api
 *
 * melinda-record-import-api program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * melinda-record-import-api is distributed in the hope that it will be useful,
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

const {ObjectId} = require('mongodb');

export default function (collectionName) {
  return {
    create,
    read,
    update,
    remove,
    query,
    queryAllRecords,
    queryAll
  };

  async function create(db, doc, user) {
    const {insertedId} = await db.collection(collectionName).insertOne({
      ...doc,
      created: {
        ...doc.created,
        timestamp: Date.now()
      },
      lastUpdated: {
        timestamp: Date.now(),
        user: user ? user.id : undefined
      }
    });
    return insertedId.toString();
  }

  async function read(db, id, protectedProperties) {
    if (collectionName === 'userMetadata') {
      const result = await db.collection(collectionName).findOne({
        id
      }, {
        projection: protectedProperties
      });
      if (result) {
        return result;
      }
      return undefined;
    }
    const result = await db.collection(collectionName).findOne({
      _id: new ObjectId(id)
    }, {
      projection: protectedProperties
    });
    if (result) {
      return result;
    }
    return undefined;
  }

  function update(db, id, doc, user) {
    format(doc);

    return db.collection(collectionName).findOneAndReplace({
      _id: new ObjectId(id)
    }, {
      ...doc,
      lastUpdated: {
        timestamp: Date.now(),
        user: doc.state === 'new' ? doc.lastUpdated.user : user.id
      }
    }, {
      returnNewDocument: true
    });

    function format(obj) {
      return Object.keys(obj)
        .filter(k => ![
          'lastUpdated',
          'user'
        ].includes(k))
        .reduce((acc, k) => ({...acc, [k]: obj[k]}), {});
    }
  }

  async function remove(db, id) {
    const query = ObjectId.isValid(id) ? {_id: new ObjectId(id)} : {id};
    const result = await db.collection(collectionName).findOneAndDelete(query);
    if (result) {
      return result;
    }
    return undefined;
  }

  function query(db, {queries, sort}, protectedProperties) {
    const result = queries.reduce((acc, {query}) => doQuery(formatQuery(query), sort), []);
    return result;

    async function doQuery(query, sort) {
      const results = [];
      const totalDoc = await db.collection(collectionName).countDocuments({});
      const cursor = await db.collection(collectionName) // eslint-disable-line functional/immutable-data
        .find(query, {projection: protectedProperties})
        .sort(sort ? sort : {_id: -1});
      return new Promise(resolve => {
        cursor.on('data', processData);
        cursor.on('end', () => results.length > 0
          ? resolve({
            results,
            totalDoc
          })
          : resolve({results}));
        function processData(doc) {
          if (collectionName === 'userMetadata') {
            const filteredDoc = {...filterDoc(doc), mongoId: doc._id.toString()};
            results.push(filteredDoc); // eslint-disable-line functional/immutable-data
            return;
          }
          const filteredDoc = {...filterDoc(doc), id: doc._id.toString()};
          results.push(filteredDoc); // eslint-disable-line functional/immutable-data

          function filterDoc(doc) {
            return Object.entries(doc)
              .filter(([key]) => key === '_id' === false)
              .reduce((acc, [
                key,
                value
              ]) => ({...acc, [key]: value}), {});
          }
        }
      });
    }

    function formatQuery(query) {
      if (Object.keys(query).length === 0) {
        return query;
      }
      return Object.keys(query).reduce((acc, key) => {
        if (key === '$or') {
          const propertyQueries = query[key].map(o => Object.entries(o).reduce((accum, [
            key,
            value
          ]) => {
            const result = convert(key, value);
            return {...accum, ...result};
          }, {}));
          return {
            ...acc,
            $or: propertyQueries
          };
        }

        const propertyQuery = convert(key, query[key]);
        return {
          ...acc,
          $and: '$and' in acc ? acc.$and.concat(propertyQuery) : [propertyQuery]
        };
        function convert(key, value) {
          if (typeof value === 'object') {
            if (Array.isArray(value)) {
              return {
                [key]: {
                  $in: value.map(getComparisonOperator)
                }
              };
            }
            return Object.entries(value).reduce((accum, [
              key1,
              value1
            ]) => ({...accum, [`${key}.${key1}`]: value1}), {});
            // Doesnot support at this moment
            // Return {
            // [key]: Object.entries(value).reduce((acc, [subKey, subValue]) => {
            // Return {
            // ...acc,
            // [subKey]: getComparisonOperator(subValue)
            // }
            // }, {})
            // };
          }

          return {
            [key]: getComparisonOperator(value)
          };

          function getComparisonOperator(value) {
            if (typeof value === 'string') {
              return {$regex: value, $options: 'i'};
            }
            if (typeof value === 'boolean' || typeof value === 'number') {
              return value;
            }
            throw new Array('Invalid query');
          }
        }
      }, {});
    }
  }

  async function queryAll(db, protectedProperties) {
    const result = await db.collection(collectionName).find({}, {projection: protectedProperties})
      .toArray();
    if (result) {
      return result.map(item => filterDoc(item));
    }

    function filterDoc(doc) {
      return Object.entries(doc)
        .reduce((acc, [
          key,
          value
        ]) => ({...acc, [key]: value}), {});
    }
  }

  async function queryAllRecords(db, {query, sort}, protectedProperties) {
    const result = await db.collection(collectionName).find(query, {projection: protectedProperties}) // eslint-disable-line functional/immutable-data
      .sort(sort ? sort : {_id: -1})
      .toArray();
    if (result) {
      const filteredDoc = result.map(item => {
        const filteredDoc = {...filterDoc(item), id: item._id.toString()};
        return filteredDoc;
      });
      return filteredDoc;
    }

    function filterDoc(doc) {
      return Object.entries(doc)
        .filter(([key]) => key === '_id' === false)
        .reduce((acc, [
          key,
          value
        ]) => ({...acc, [key]: value}), {});
    }
  }
}
