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

import {isValidIssnIdentifier} from './validators';
import {isMysqlOrMaria} from '../utils';
import {TABLE_PREFIX} from '../../config';

/* eslint-disable new-cap, functional/no-this-expressions */
export default function (sequelize, dialect) {
  sequelize.define(
    'issnRange', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        type: isMysqlOrMaria(dialect) ? DataTypes.INTEGER(11) : DataTypes.INTEGER
      },
      idOld: {
        type: DataTypes.INTEGER
      },
      block: {
        type: DataTypes.STRING(4),
        allowNull: false
      },
      rangeBegin: {
        type: DataTypes.STRING(4),
        allowNull: false,
        validate: {
          isValidRangeBegin(value) {
            if (value.length !== 4) {
              throw new Error('ISSN range begin must be length of 4');
            }

            const beginValue = `${this.block}-${value}`;
            isValidIssnIdentifier(beginValue);

            const beginNumber = Number(value.slice(0, -1));
            const endNumber = Number(this.rangeEnd.slice(0, -1));

            if (beginNumber > endNumber) {
              throw new Error('ISSN range begin cannot be greater than range end');
            }
          }
        }
      },
      rangeEnd: {
        type: DataTypes.STRING(4),
        allowNull: false,
        validate: {
          isValidRangeBegin(value) {
            if (value.length !== 4) {
              throw new Error('ISSN range end must be length of 4');
            }

            const endValue = `${this.block}-${value}`;
            isValidIssnIdentifier(endValue);

            const beginNumber = Number(this.rangeBegin.slice(0, -1));
            const endNumber = Number(value.slice(0, -1));

            if (beginNumber > endNumber) {
              throw new Error('ISSN range begin cannot be greater than range end');
            }
          }
        }
      },
      free: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0
        }
      },
      taken: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      next: {
        type: DataTypes.STRING(4),
        allowNull: false,
        validate: {
          isValidNext(value) {
            if (value !== '' && value.length !== 4) {
              throw new Error('ISSN range next must be length of 4');
            }

            if (value !== '') {
              const nextValue = `${this.block}-${value}`;
              return isValidIssnIdentifier(nextValue);
            }
          }
        }
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
        validate: {
          isValid(value) {
            if (this.isClosed && value) {
              throw new Error('ISSN range cannot be active while it\'s closed');
            }
          }
        }
      },
      isClosed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
        validate: {
          isValid(value) {
            if (this.isActive && value) {
              throw new Error('ISSN range cannot be closed while it\'s active');
            }
          }
        }
      },
      createdBy: {
        type: DataTypes.STRING(30)
      },
      modifiedBy: {
        type: DataTypes.STRING(30)
      }
    },
    {
      tableName: `${TABLE_PREFIX}_issn_registry_issn_range`,
      underscored: true,
      createdAt: 'created',
      updatedAt: 'modified'
    }
  );
}
