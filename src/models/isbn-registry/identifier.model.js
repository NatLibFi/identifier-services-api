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

import {ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES, ISBN_REGISTRY_PUBLICATION_PRINT_TYPES} from '../../interfaces/constants';

import {isValidIsbnOrIsmnIdentifier} from './validators';
import {canApplyIndex, isMysqlOrMaria} from '../utils';
import {TABLE_PREFIX} from '../../config';

export default function (sequelize, dialect) {
  // SQLite does not allow shared names for index
  const indexes = canApplyIndex(dialect) ? getIndexes() : [];

  function getIndexes() {
    return [
      {
        name: 'idx_identifier',
        fields: ['identifier']
      },
      {
        name: 'idx_identifier_batch_id',
        fields: ['identifier_batch_id']
      }
    ];
  }

  sequelize.define(
    'identifier', {
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
      subRangeId: {
        field: 'publisher_identifier_range_id',
        type: DataTypes.INTEGER,
        allowNull: false
      },
      publicationType: {
        allowNull: false,
        type: DataTypes.STRING(25),
        defaultValue: '',
        validate: {
          isValidPublicationType(value) {
            const validPublicationTypes = [
              ...Object.values(ISBN_REGISTRY_PUBLICATION_PRINT_TYPES),
              ...Object.values(ISBN_REGISTRY_PUBLICATION_ELECTRONICAL_TYPES)
            ];

            if (value !== '' && !validPublicationTypes.includes(value)) {
              throw new Error('Invalid publication type');
            }
          }
        }
      }
    },
    {
      tableName: `${TABLE_PREFIX}_isbn_registry_identifier`,
      underscored: true,
      timestamps: false,
      indexes
    }
  );
}
