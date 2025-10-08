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

import {isValidIsbnOrIsmnIdentifier} from './validators';
import {canApplyIndex, isMysqlOrMaria} from '../utils';
import {TABLE_PREFIX} from '../../config';

export default function (sequelize, dialect) {
  // SQLite does not allow shared names for index
  const indexes = canApplyIndex(dialect) ? getIndexes() : [];

  function getIndexes() {
    return [
      {
        name: 'idx_publisher_id',
        fields: ['publisher_id']
      },
      {
        name: 'idx_publisher_identifier_range_id',
        fields: ['publisher_identifier_range_id']
      },
      {
        name: 'idx_identifier',
        fields: ['identifier']
      },
      {
        name: 'idx_category',
        fields: ['category']
      }
    ];
  }

  sequelize.define(
    'identifierCanceled', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        type: isMysqlOrMaria(dialect) ? DataTypes.INTEGER(11) : DataTypes.INTEGER
      },
      identifier: {
        unique: true,
        allowNull: false,
        type: DataTypes.STRING(20),
        validate: {
          isValidIsbnOrIsmnIdentifier
        }
      },
      identifierType: {
        allowNull: false,
        type: DataTypes.STRING(4),
        validate: {
          is: /^ISBN$|^ISMN$/
        }
      },
      category: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          isValidCategory(value) {
            if (this.identifierType === 'ISBN') {
              if (value > 5 || value < 1) {
                throw new Error('Invalid category for ISBN');
              }

              return;
            }

            if (this.identifierType === 'ISMN') {
              // Canceled identifier category value mirrors publisher range category value
              if (![1, 2, 3, 5].includes(value)) {
                throw new Error('Invalid category for ISMN');
              }

              return;
            }

            throw new Error('Invalid identifierType');
          }
        }
      },
      subRangeId: {
        field: 'publisher_identifier_range_id',
        type: DataTypes.INTEGER,
        allowNull: false
      },
      canceledBy: {
        type: DataTypes.STRING(30)
      }
    },
    {
      tableName: `${TABLE_PREFIX}_isbn_registry_identifier_canceled`,
      underscored: true,
      createdAt: 'canceled',
      updatedAt: false,
      indexes
    }
  );
}
