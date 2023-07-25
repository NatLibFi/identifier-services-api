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

/* Based on original work by Petteri Kivimäki https://github.com/petkivim/ (Identifier Registry) */

import {DataTypes} from 'sequelize';

import {isMysqlOrMaria} from '../utils';
import {TABLE_PREFIX} from '../../config';

/* eslint-disable new-cap, functional/no-this-expressions */
export default function (sequelize, dialect) {
  sequelize.define(
    'ismnRange', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        type: isMysqlOrMaria(dialect) ? DataTypes.INTEGER(11) : DataTypes.INTEGER
      },
      prefix: {
        allowNull: false,
        type: DataTypes.STRING(5),
        validate: {
          is: /^979-0$/ // eslint-disable-line require-unicode-regexp
        }
      },
      category: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          isValidIsmnRangeCategory(value) {
            const validCategories = [3, 5, 6, 7];
            if (!validCategories.includes(value)) {
              throw new Error('Invalid ISMN range category');
            }
          }
        }
      },
      rangeBegin: {
        allowNull: false,
        type: DataTypes.STRING(7),
        validate: {
          isValidRangeBegin(value) {
            if (this.rangeEnd.length !== value.length) {
              throw new Error('Range begin should be of same length than range end');
            }

            if (value.length !== this.category) {
              throw new Error('Range begin length should match range category');
            }

            const rangeBeginNumber = Number(value);
            const rangeEndNumber = Number(this.rangeEnd);
            if (isNaN(rangeBeginNumber) || isNaN(rangeEndNumber)) {
              throw new Error('Range begin and end needs to be numeric value');
            }

            if (rangeBeginNumber > rangeEndNumber) {
              throw new Error('Range end must be greater than range begin');
            }
          }
        }
      },
      rangeEnd: {
        allowNull: false,
        type: DataTypes.STRING(7),
        validate: {
          isValidRangeEnd(value) {
            if (this.rangeBegin.length !== value.length) {
              throw new Error('Range begin should be of same length than range end');
            }

            if (value.length !== this.category) {
              throw new Error('Range end length should match range category');
            }

            const rangeBeginNumber = Number(this.rangeBegin);
            const rangeEndNumber = Number(value);
            if (isNaN(rangeBeginNumber) || isNaN(rangeEndNumber)) {
              throw new Error('Range begin and end needs to be numeric value');
            }

            if (rangeBeginNumber > rangeEndNumber) {
              throw new Error('Range end must be greater than range begin');
            }
          }
        }
      },
      free: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          min: 0
        }
      },
      taken: {
        defaultValue: 0,
        allowNull: false,
        type: DataTypes.INTEGER
      },
      canceled: {
        defaultValue: 0,
        allowNull: false,
        type: DataTypes.INTEGER
      },
      next: {
        allowNull: false,
        type: DataTypes.STRING(7),
        validate: {
          isValidNext(value) {
            const nextNumber = Number(value);

            if (isNaN(nextNumber)) {
              throw new Error('Next value needs to be numerical');
            }

            if (nextNumber < Number(this.rangeBegin)) {
              throw new Error('Next value cannot be smaller than range begin');
            }
          }
        }
      },
      isActive: {
        defaultValue: 1,
        allowNull: false,
        type: DataTypes.BOOLEAN,
        validate: {
          isValid(value) {
            if (this.isClosed && value) {
              throw new Error('Subrange cannot be active while it\'s closed');
            }
          }
        }
      },
      isClosed: {
        defaultValue: 0,
        allowNull: false,
        type: DataTypes.BOOLEAN,
        validate: {
          isValid(value) {
            if (this.isActive && value) {
              throw new Error('Subrange cannot be closed while it\'s active');
            }
          }
        }
      },
      idOld: {
        type: DataTypes.INTEGER
      },
      createdBy: {
        type: DataTypes.STRING(30)
      },
      modifiedBy: {
        type: DataTypes.STRING(30)
      }
    },
    {
      tableName: `${TABLE_PREFIX}_isbn_registry_ismn_range`,
      underscored: true,
      createdAt: 'created',
      updatedAt: 'modified'
    }
  );
}
