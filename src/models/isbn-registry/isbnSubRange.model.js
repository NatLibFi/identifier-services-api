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
import {ISBN_REGISTRY_ISBN_RANGE_LENGTH} from '../../interfaces/constants';
import {TABLE_PREFIX} from '../../config';

/* eslint-disable new-cap, functional/no-this-expressions */

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
        name: 'idx_isbn_range_id',
        fields: ['isbn_range_id']
      }
    ];
  }

  sequelize.define(
    'isbnSubRange', {
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
          is: /^978-95(?:1|2)-[0-9]{1,5}$/u,
          matchesCategory(value) {
            const publisherIdentifierAsArray = value.split('-');
            const publisherIdentifierNumber = publisherIdentifierAsArray.at(-1);
            const rangeCategory = ISBN_REGISTRY_ISBN_RANGE_LENGTH - this.category;

            if (publisherIdentifierNumber.length !== rangeCategory) {
              throw new Error('Publisher identifier value does not match category');
            }
          }
        },
        unique: true
      },
      category: {
        allowNull: false,
        type: DataTypes.INTEGER,
        validate: {
          min: 1,
          max: 5,
          matchesPublisherIdentifier(value) {
            const publisherIdentifierAsArray = this.publisherIdentifier.split('-');
            const publisherIdentifierNumber = publisherIdentifierAsArray.at(-1);
            const rangeCategory = ISBN_REGISTRY_ISBN_RANGE_LENGTH - value;

            if (publisherIdentifierNumber.length !== rangeCategory) {
              throw new Error('Category does not match publisher identifier value');
            }
          }
        }
      },
      rangeBegin: {
        allowNull: false,
        type: DataTypes.STRING(5),
        validate: {
          isValidRangeBegin(value) {
            if (value.length !== this.rangeEnd.length) {
              throw new Error('Range begin and range end need to have equal length value');
            }

            if (value.length !== this.category) {
              throw new Error('Range begin length must match range category');
            }

            const rangeBeginNumber = Number(value);
            const rangeEndNumber = Number(this.rangeEnd);

            if (isNaN(rangeBeginNumber) || isNaN(rangeEndNumber)) {
              throw new Error('Range begin and end values must be numeric values');
            }

            if (rangeBeginNumber > rangeEndNumber) {
              throw new Error('Range begin cannot be greater than range end');
            }
          }
        }
      },
      rangeEnd: {
        allowNull: false,
        type: DataTypes.STRING(5),
        validate: {
          isValidRangeBegin(value) {
            if (value.length !== this.rangeBegin.length) {
              throw new Error('Range begin and range end need to have equal length value');
            }

            if (value.length !== this.category) {
              throw new Error('Range begin length must match range category');
            }

            const rangeBeginNumber = Number(this.rangeBegin);
            const rangeEndNumber = Number(value);

            if (isNaN(rangeBeginNumber) || isNaN(rangeEndNumber)) {
              throw new Error('Range begin and end values must be numeric values');
            }

            if (rangeBeginNumber > rangeEndNumber) {
              throw new Error('Range begin cannot be greater than range end');
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
      deleted: {
        defaultValue: 0,
        allowNull: false,
        type: DataTypes.INTEGER
      },
      next: {
        allowNull: false,
        type: DataTypes.STRING(5),
        validate: {
          isValidNext(value) {
            if (this.canceled === 0 && (!this.isClosed || this.isActive) && value.length !== this.category) {
              throw new Error('Next value length should match range category');
            }

            const nextNumber = Number(value);
            if (isNaN(nextNumber)) {
              throw new Error('Next value needs to be numerical');
            }

            if (nextNumber < Number(this.rangeBegin)) {
              throw new Error('Next value cannot be smaller than rangeBegin');
            }

            if (nextNumber > Number(this.rangeEnd) + 1) {
              // Note: next value may be exactly one greater than range end after last identifier from range has been given
              // Subrange might be active after this in situation if there are cancelled identifiers available for reuse
              throw new Error('Next value may not be greater than +1 from range end value ever');
            }
          }
        }
      },
      isActive: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
        validate: {
          isValid(value) {
            if (this.isClosed && value) {
              throw new Error('Subrange cannot be active while it\'s closed');
            }
          }
        }
      },
      isClosed: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
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
      tableName: `${TABLE_PREFIX}_isbn_registry_publisher_isbn_range`,
      underscored: true,
      createdAt: 'created',
      updatedAt: 'modified',
      indexes
    }
  );
}
