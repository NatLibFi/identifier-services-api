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

import {previousStringDataToArray, arrayToString} from '../modelUtils';
import {canApplyIndex, isMysqlOrMaria} from '../utils';

import {TABLE_PREFIX} from '../../config';

/* eslint-disable new-cap,functional/no-this-expressions */
export default function (sequelize, dialect) {
  // SQLite does not allow shared names for index
  const indexes = canApplyIndex(dialect) ? getIndexes() : [];

  function getIndexes() {
    return [
      {
        name: 'idx_official_name',
        fields: ['official_name']
      },
      {
        name: 'idx_publisher_id',
        fields: ['publisher_id']
      }
    ];
  }

  sequelize.define(
    'publicationIsbn', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        type: isMysqlOrMaria(dialect) ? DataTypes.INTEGER(11) : DataTypes.INTEGER
      },
      officialName: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      publisherIdentifierStr: {
        type: DataTypes.STRING(20)
      },
      publicationIdentifierPrint: {
        type: DataTypes.STRING(150),
        defaultValue: ''
      },
      publicationIdentifierElectronical: {
        type: DataTypes.STRING(150),
        defaultValue: ''
      },
      publicationIdentifierType: {
        type: DataTypes.STRING(4),
        defaultValue: ''
      },
      locality: {
        type: DataTypes.STRING(50)
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
      contactPerson: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      phone: {
        type: DataTypes.STRING(30),
        allowNull: false
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      langCode: {
        type: DataTypes.STRING(8)
      },
      publishedBefore: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0
      },
      publicationsPublic: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0
      },
      publicationsIntra: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0
      },
      publishingActivity: {
        type: DataTypes.STRING(10)
      },
      publishingActivityAmount: {
        type: DataTypes.STRING(5)
      },
      publicationType: {
        type: DataTypes.STRING(15)
      },
      publicationFormat: {
        type: DataTypes.STRING(20)
      },
      firstName1: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'first_name_1'
      },
      lastName1: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'last_name_1'
      },
      role1: {
        type: DataTypes.STRING(40),
        allowNull: false,
        field: 'role_1',
        get() {
          return previousStringDataToArray(this.getDataValue('role1'));
        },
        set(v) {
          const value = arrayToString(v);
          this.setDataValue('role1', value);
        }
      },
      firstName2: {
        type: DataTypes.STRING(50),
        field: 'first_name_2'
      },
      lastName2: {
        type: DataTypes.STRING(50),
        field: 'last_name_2'
      },
      role2: {
        type: DataTypes.STRING(40),
        field: 'role_2',
        get() {
          return previousStringDataToArray(this.getDataValue('role2'));

        },
        set(v) {
          const value = arrayToString(v);
          this.setDataValue('role2', value);
        }
      },
      firstName3: {
        type: DataTypes.STRING(50),
        field: 'first_name_3'
      },
      lastName3: {
        type: DataTypes.STRING(50),
        field: 'last_name_3'
      },
      role3: {
        type: DataTypes.STRING(40),
        field: 'role_3',
        get() {
          return previousStringDataToArray(this.getDataValue('role3'));
        },
        set(v) {
          const value = arrayToString(v);
          this.setDataValue('role3', value);
        }
      },
      firstName4: {
        type: DataTypes.STRING(50),
        field: 'first_name_4'
      },
      lastName4: {
        type: DataTypes.STRING(50),
        field: 'last_name_4'
      },
      role4: {
        type: DataTypes.STRING(40),
        field: 'role_4',
        get() {
          return previousStringDataToArray(this.getDataValue('role4'));
        },
        set(v) {
          const value = arrayToString(v);
          this.setDataValue('role4', value);
        }
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      subtitle: {
        type: DataTypes.STRING(200)
      },
      mapScale: {
        type: DataTypes.STRING(50)
      },
      language: {
        type: DataTypes.STRING(3),
        allowNull: false
      },
      year: {
        type: DataTypes.STRING(4),
        allowNull: false
      },
      month: {
        type: DataTypes.STRING(2),
        allowNull: false
      },
      series: {
        type: DataTypes.STRING(200)
      },
      issn: {
        type: DataTypes.STRING(9)
      },
      volume: {
        type: DataTypes.STRING(20)
      },
      printingHouse: {
        type: DataTypes.STRING(100)
      },
      printingHouseCity: {
        type: DataTypes.STRING(50)
      },
      copies: {
        type: DataTypes.STRING(10)
      },
      edition: {
        type: DataTypes.STRING(2)
      },
      type: {
        type: DataTypes.STRING(50),
        get() {
          return previousStringDataToArray(this.getDataValue('type'));
        },
        set(v) {
          const value = arrayToString(v);
          this.setDataValue('type', value);
        }
      },
      typeOther: {
        type: DataTypes.STRING(100)
      },
      comments: {
        type: DataTypes.STRING(2000)
      },
      fileformat: {
        type: DataTypes.STRING(25),
        get() {
          return previousStringDataToArray(this.getDataValue('fileformat'));
        },
        set(v) {
          const value = arrayToString(v);
          this.setDataValue('fileformat', value);
        }
      },
      fileformatOther: {
        type: DataTypes.STRING(100)
      },
      noIdentifierGranted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0
      },
      onProcess: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0
      },
      createdBy: {
        type: DataTypes.STRING(30)
      },
      modifiedBy: {
        type: DataTypes.STRING(30)
      }
    },
    {
      tableName: `${TABLE_PREFIX}_isbn_registry_publication`,
      underscored: true,
      createdAt: 'created',
      updatedAt: 'modified',
      indexes
    }
  );
}
