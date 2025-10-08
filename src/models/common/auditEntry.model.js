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

import {DataTypes} from 'sequelize';

import {isMysqlOrMaria} from '../utils';
import {TABLE_PREFIX} from '../../config';

export default function (sequelize, dialect) {
  sequelize.define(
    'auditEntry', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        type: isMysqlOrMaria(dialect) ? DataTypes.INTEGER(11) : DataTypes.INTEGER
      },
      user: {
        allowNull: false,
        type: DataTypes.STRING(64)
      },
      operation: {
        allowNull: false,
        type: DataTypes.STRING(64)
      },
      // Tablename which the operation primarily considers
      primaryTable: {
        allowNull: true,
        type: DataTypes.STRING(64)
      },
      // Primary key of the entry that is handled in the operation from the primary table
      primaryTablePrimaryKey: {
        allowNull: true,
        type: DataTypes.INTEGER(11)
      },
      comment: {
        allowNull: true,
        type: DataTypes.STRING(300)
      }
    },
    {
      tableName: `${TABLE_PREFIX}_common_audit_entry`,
      underscored: true,
      createdAt: 'created',
      updatedAt: false
    }
  );
}
