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
import {TABLE_PREFIX} from '../../config';

/* eslint-disable new-cap,functional/no-this-expressions */

export default function (sequelize, dialect) {
  // SQLite does not allow shared names for index
  const indexes = canApplyIndex(dialect) ? getIndexes() : [];

  function getIndexes() {
    return [
      {
        name: 'idx_publisher_id',
        fields: ['publisher_id']
      }
    ];
  }

  sequelize.define(
    'publisherIsbnArchiveRecord', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        type: isMysqlOrMaria(dialect) ? DataTypes.INTEGER(11) : DataTypes.INTEGER
      },
      officialName: {
        allowNull: false,
        type: DataTypes.STRING(100)
      },
      otherNames: {
        type: DataTypes.STRING(200)
      },
      address: {
        allowNull: false,
        type: DataTypes.STRING(50)
      },
      zip: {
        allowNull: false,
        type: DataTypes.STRING(10)
      },
      city: {
        allowNull: false,
        type: DataTypes.STRING(50)
      },
      phone: {
        type: DataTypes.STRING(30)
      },
      email: {
        allowNull: false,
        type: DataTypes.STRING(100)
      },
      www: {
        type: DataTypes.STRING(100)
      },
      langCode: {
        type: DataTypes.STRING(8)
      },
      contactPerson: {
        type: DataTypes.STRING(100)
      },
      frequencyCurrent: {
        field: 'question_1',
        type: DataTypes.STRING(50)
      },
      frequencyNext: {
        field: 'question_2',
        type: DataTypes.STRING(50)
      },
      affiliateOf: {
        field: 'question_3',
        type: DataTypes.STRING(50)
      },
      affiliates: {
        field: 'question_4',
        type: DataTypes.STRING(200)
      },
      distributorOf: {
        field: 'question_5',
        type: DataTypes.STRING(200)
      },
      distributors: {
        field: 'question_6',
        type: DataTypes.STRING(50)
      },
      classification: {
        field: 'question_7',
        type: DataTypes.STRING(50),
        get() {
          return this.getDataValue('classification') ? this.getDataValue('classification').split(',') : this.getDataValue('classification');
        },
        set(v) {
          this.setDataValue('classification', v.join(','));
        }
      },
      classificationOther: {
        field: 'question_8',
        type: DataTypes.STRING(50)
      },
      confirmation: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      idOld: {
        type: DataTypes.INTEGER
      },
      createdBy: {
        type: DataTypes.STRING(30)
      }
    },
    {
      tableName: `${TABLE_PREFIX}_isbn_registry_publisher_archive`,
      underscored: true,
      createdAt: 'created',
      updatedAt: false,
      indexes
    }
  );
}
