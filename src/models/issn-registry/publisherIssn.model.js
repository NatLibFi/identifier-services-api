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

/* Based on original work by Petteri Kivimäki (Identifier Registry) */

import {DataTypes} from 'sequelize';

import {canApplyIndex, isMysqlOrMaria} from '../utils';
import {jsonToPreviousString, previousStringToJson} from '../modelUtils';
import {TABLE_PREFIX} from '../../config';

/* eslint-disable new-cap,functional/no-this-expressions */
export default function (sequelize, dialect) {
  const indexes = canApplyIndex(dialect) ? getIndexes() : [];

  function getIndexes() {
    return [
      {
        name: 'idx_official_name',
        fields: ['official_name']
      },
      {
        name: 'idx_form_id',
        fields: ['form_id']
      }
    ];
  }

  sequelize.define(
    'publisherIssn', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        type: isMysqlOrMaria(dialect) ? DataTypes.INTEGER(11) : DataTypes.INTEGER
      },
      idOld: {
        type: DataTypes.INTEGER
      },
      officialName: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      contactPerson: {
        type: DataTypes.STRING(1200),
        /* eslint-disable functional/no-this-expressions */
        get() {
          return this.getDataValue('contactPerson') ? previousStringToJson(this.getDataValue('contactPerson')) : this.getDataValue('contactPerson');
        },
        set(v) {
          this.setDataValue('contactPerson', jsonToPreviousString(v));
        }
        /* eslint-enable functional/no-this-expressions */
      },
      emailCommon: {
        type: DataTypes.STRING(100)
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
      langCode: {
        type: DataTypes.STRING(8)
      },
      additionalInfo: {
        type: DataTypes.STRING(2000)
      },
      createdBy: {
        type: DataTypes.STRING(30)
      },
      modifiedBy: {
        type: DataTypes.STRING(30)
      }
    },
    {
      tableName: `${TABLE_PREFIX}_issn_registry_publisher`,
      underscored: true,
      createdAt: 'created',
      updatedAt: 'modified',
      indexes
    }
  );
}
