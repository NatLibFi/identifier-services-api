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

import {canApplyIndex, isMysqlOrMaria} from '../utils';
import {TABLE_PREFIX} from '../../config';

/* eslint-disable new-cap */
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
        name: 'idx_ismn_range_id',
        fields: ['ismn_range_id']
      }
    ];
  }

  sequelize.define(
    'ismnSubRange', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        type: isMysqlOrMaria(dialect) ? DataTypes.INTEGER(11) : DataTypes.INTEGER
      },
      publisherIdentifier: {
        allowNull: false,
        type: DataTypes.STRING(15),
        validate: {
          is: /^[0-9-]+$/u
        },
        unique: true
      },
      category: {
        allowNull: false,
        type: DataTypes.INTEGER
      },
      rangeBegin: {
        allowNull: false,
        type: DataTypes.STRING(7)
      },
      rangeEnd: {
        allowNull: false,
        type: DataTypes.STRING(7)
      },
      free: {
        allowNull: false,
        type: DataTypes.INTEGER
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
      deleted: {
        defaultValue: 0,
        allowNull: false,
        type: DataTypes.INTEGER
      },
      next: {
        allowNull: false,
        type: DataTypes.STRING(7)
      },
      isActive: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: 1
      },
      isClosed: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: 0
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
      tableName: `${TABLE_PREFIX}_isbn_registry_publisher_ismn_range`,
      underscored: true,
      createdAt: 'created',
      updatedAt: 'modified',
      indexes
    }
  );
}
