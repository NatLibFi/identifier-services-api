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

/* Based on implementation of fixura-mongo-js by University Of Helsinki (The National Library Of Finland) */

import fixturesFactory, {READERS} from '@natlibfi/fixura';
import sequelize from '../../models';

export default function ({rootPath} = {}) {
  const {getFixture} = fixturesFactory({root: rootPath, reader: READERS.JSON});

  return {populate, close, dump};

  // Note: use this ONLY for in-memory sqlite for automated testing with trusted files!
  // Contains eval etc.
  async function populate(input, dbInitRequired) {
    try {
      if (dbInitRequired) {
        const data = Array.isArray(input) ? clone(getFixture({components: input})) : clone(input);
        const promises = [];
        const modifiedTimeUpdatePromises = [];

        await sequelize.sync({force: true});
        const {models} = sequelize; // eslint-disable-line no-unused-vars
        Object.keys(data).forEach(name => {
          const model = `models.${name}`;

          data[name].forEach(item => {
            promises.push(`${model}.create(${JSON.stringify(item)})`); // eslint-disable-line functional/immutable-data
          });
        });

        // Set modified value (Sequelize default: updatedAt) if it's defined in the db initialization object attributes and there is id to use as reference
        // Since this attribute is auto-updated by sequelize internals, this the chosen way to pre-define the value when initializing in-memory db from JSON file
        // The process is done in separate step because the database entity needs to exist (and have id) before it can be updated
        // As of the current date, Sequelize seems to not allow setting updatedAt during create operation
        Object.keys(data).forEach(name => {
          const model = `models.${name}`;

          data[name].forEach(item => {
            const hasId = Object.keys(item).includes('id');
            const hasModified = Object.keys(item).includes('modified');

            if (hasId && hasModified) { // eslint-disable-line functional/no-conditional-statements
              // Derived from GitHub issue comment of GitHub user jzyds proposing use of sequelize.query: https://github.com/sequelize/sequelize/issues/12386#issuecomment-1280004433
              modifiedTimeUpdatePromises.push(`UPDATE ${eval(model).tableName} SET modified = '${item.modified}' WHERE id = ${item.id}`); // eslint-disable-line functional/immutable-data,no-eval
            }
          });
        });

        await Promise.all(promises.map(p => eval(p))); // eslint-disable-line no-eval
        await Promise.all(modifiedTimeUpdatePromises.map(p => sequelize.query(p))); // eslint-disable-line no-eval

        return;
      }

      // Tables need to be redone even if no initial data is inserted
      await sequelize.sync({force: true});
      return;
    } catch (err) {
      console.log(err); // eslint-disable-line
      throw err;
    }

  }

  async function close() {
    await sequelize.close();
  }

  async function dump() {
    const {models} = sequelize; // eslint-disable-line no-unused-vars

    const results = await Promise.all(Object.keys(models).map(name => new Promise((resolve, reject) => {
      try {
        eval(`models.${name}.findAll({raw: true})`) // eslint-disable-line no-eval
          .then(queryResult => {
            resolve({[name]: queryResult});
          });
      } catch (err) {
        reject(err);
      }
    })));

    return results;
  }
}

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}
