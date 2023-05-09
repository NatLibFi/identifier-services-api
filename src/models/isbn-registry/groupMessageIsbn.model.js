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

// NOTE: not in use
/* eslint-disable new-cap,functional/no-this-expressions */
/* istanbul ignore next */
export default function (sequelize, dialect) {
  // SQLite does not allow shared names for index
  const indexes = canApplyIndex(dialect) ? getIndexes() : [];

  function getIndexes() {
    return [
      {
        name: 'idx_message_type_id',
        fields: ['message_type_id']
      }
    ];
  }

  sequelize.define(
    'groupMessageIsbn', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        type: isMysqlOrMaria(dialect) ? DataTypes.INTEGER(11) : DataTypes.INTEGER
      },
      isbnCategories: {
        type: DataTypes.STRING(20),
        defaultValue: '',
        get() {
          return this.getDataValue('isbnCategories') ? this.getDataValue('isbnCategories').split(',') : this.getDataValue('isbnCategories');
        },
        set(v) {
          this.setDataValue('isbnCategories', v.join(','));
        }
      },
      isbnPublishersCount: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      ismnCategories: {
        type: DataTypes.STRING(20),
        defaultValue: '',
        get() {
          return this.getDataValue('ismnCategories') ? this.getDataValue('ismnCategories').split(',') : this.getDataValue('ismnCategories');
        },
        set(v) {
          this.setDataValue('ismnCategories', v.join(','));
        }
      },
      ismnPublishersCount: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      publishersCount: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      hasQuitted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0
      },
      successCount: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      failCount: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      noEmailCount: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      createdBy: {
        type: DataTypes.STRING(30),
        allowNull: false
      },
      finished: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: '0000-00-00 00:00:00'
      }
    },
    {
      tableName: `${TABLE_PREFIX}_isbn_registry_group_message`,
      underscored: true,
      createdAt: 'created',
      updatedAt: false,
      indexes
    }
  );
}
