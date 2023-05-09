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

  async function populate(input, dbInitRequired) {
    try {
      if (dbInitRequired) {
        const data = Array.isArray(input) ? clone(getFixture({components: input})) : clone(input);
        const promises = [];

        await sequelize.sync({force: true});
        const {models} = sequelize; // eslint-disable-line no-unused-vars
        Object.keys(data).forEach(name => {
          const model = `models.${name}`;

          data[name].forEach(item => {
            promises.push(`${model}.create(${JSON.stringify(item)})`); // eslint-disable-line functional/immutable-data
          });
        });

        await Promise.all(promises.map(p => eval(p))); // eslint-disable-line no-eval
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
