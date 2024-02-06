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
import {canApplyIndex, isMysqlOrMaria} from '../utils';
import {TABLE_PREFIX} from '../../config';
import {jsonToPreviousString, previousStringToJson} from '../modelUtils';

/* eslint-disable new-cap */

export default function (sequelize, dialect) {
  const indexes = canApplyIndex(dialect) ? getIndexes() : [];

  function getIndexes() {
    return [
      {
        name: 'idx_title',
        fields: ['title']
      },
      {
        name: 'idx_issn',
        fields: ['issn']
      },
      {
        name: 'idx_form_id',
        fields: ['form_id']
      },
      {
        name: 'idx_publisher_id',
        fields: ['publisher_id']
      }
    ];
  }

  sequelize.define(
    'publicationIssn', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        type: isMysqlOrMaria(dialect) ? DataTypes.INTEGER(11) : DataTypes.INTEGER
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      subtitle: {
        type: DataTypes.STRING(200)
      },
      issn: {
        type: DataTypes.STRING(9),
        defaultValue: '',
        validate: {
          isValidPublicationIssn(value) {
            if (value !== '') {
              return isValidIssnIdentifier(value);
            }
          }
        }
      },
      placeOfPublication: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      printer: {
        type: DataTypes.STRING(100)
      },
      issuedFromYear: {
        type: DataTypes.STRING(4)
      },
      issuedFromNumber: {
        type: DataTypes.STRING(100)
      },
      frequency: {
        type: DataTypes.CHAR(1)
      },
      frequencyOther: {
        type: DataTypes.STRING(50)
      },
      language: {
        type: DataTypes.STRING(50)
      },
      publicationType: {
        type: DataTypes.STRING(25)
      },
      publicationTypeOther: {
        type: DataTypes.STRING(50)
      },
      medium: {
        type: DataTypes.STRING(7)
      },
      mediumOther: {
        type: DataTypes.STRING(50)
      },
      url: {
        type: DataTypes.STRING(100)
      },
      // Note: attribute name does not directly map to column name. This is due to 'previous' being reserved built-int method for Sequelize ORM model.
      // previousEntity (as model attribute) -> previous (as table column)
      previousEntity: {
        type: DataTypes.STRING(850),
        field: 'previous',
        /* eslint-disable functional/no-this-expressions */
        get() {
          return this.getDataValue('previousEntity') ? previousStringToJson(this.getDataValue('previousEntity')) : this.getDataValue('previousEntity');
        },
        set(v) {
          this.setDataValue('previousEntity', jsonToPreviousString(v));
        }
        /* eslint-enable functional/no-this-expressions */
      },
      mainSeries: {
        type: DataTypes.STRING(850),
        /* eslint-disable functional/no-this-expressions */
        get() {
          return previousStringToJson(this.getDataValue('mainSeries'));
        },
        set(v) {
          this.setDataValue('mainSeries', jsonToPreviousString(v));
        }
        /* eslint-enable functional/no-this-expressions */
      },
      subseries: {
        type: DataTypes.STRING(850),
        /* eslint-disable functional/no-this-expressions */
        get() {
          return this.getDataValue('subseries') ? previousStringToJson(this.getDataValue('subseries')) : this.getDataValue('subseries');
        },
        set(v) {
          this.setDataValue('subseries', jsonToPreviousString(v));
        }
        /* eslint-enable functional/no-this-expressions */
      },
      anotherMedium: {
        type: DataTypes.STRING(850),
        /* eslint-disable functional/no-this-expressions */
        get() {
          return this.getDataValue('anotherMedium') ? previousStringToJson(this.getDataValue('anotherMedium')) : this.getDataValue('anotherMedium');
        },
        set(v) {
          this.setDataValue('anotherMedium', jsonToPreviousString(v));
        }
        /* eslint-enable functional/no-this-expressions */
      },
      additionalInfo: {
        type: DataTypes.STRING(2000)
      },
      status: {
        type: DataTypes.STRING(24),
        defaultValue: 'NO_PREPUBLICATION_RECORD'
      },
      createdBy: {
        type: DataTypes.STRING(30)
      },
      modifiedBy: {
        type: DataTypes.STRING(30)
      }
    },
    {
      tableName: `${TABLE_PREFIX}_issn_registry_publication`,
      underscored: true,
      createdAt: 'created',
      updatedAt: 'modified',
      indexes
    }
  );
}
