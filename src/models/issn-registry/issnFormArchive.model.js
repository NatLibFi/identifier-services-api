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

export default function (sequelize, dialect) {
  // SQLite does not allow shared names for index
  const indexes = canApplyIndex(dialect) ? getIndexes() : [];

  function getIndexes() {
    return [
      {
        name: 'idx_form_id',
        fields: ['form_id']
      }
    ];
  }

  sequelize.define(
    'issnFormArchive', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        type: isMysqlOrMaria(dialect) ? DataTypes.INTEGER(11) : DataTypes.INTEGER
      },
      idOld: {
        type: DataTypes.INTEGER
      },
      publisher: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      contactPerson: {
        type: DataTypes.STRING(600)
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      phone: {
        type: DataTypes.STRING(30)
      },
      address: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      zip: {
        type: DataTypes.STRING(10),
        allowNull: false
      },
      city: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      publicationCount: {
        type: DataTypes.INTEGER
      },
      langCode: {
        type: DataTypes.STRING(8)
      },
      createdBy: {
        type: DataTypes.STRING(30)
      }
    },
    {
      tableName: `${TABLE_PREFIX}_issn_registry_form_archive`,
      underscored: true,
      createdAt: 'created',
      updatedAt: false,
      indexes
    }
  );
}
