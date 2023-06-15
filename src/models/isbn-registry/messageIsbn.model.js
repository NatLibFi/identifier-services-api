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

import {isMysqlOrMaria} from '../utils';
import {TABLE_PREFIX} from '../../config';

/* eslint-disable new-cap */
export default function (sequelize, dialect) {
  sequelize.define(
    'messageIsbn', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        type: isMysqlOrMaria(dialect) ? DataTypes.INTEGER(11) : DataTypes.INTEGER
      },
      recipient: {
        allowNull: false,
        type: DataTypes.STRING(100)
      },
      subject: {
        allowNull: false,
        type: DataTypes.STRING(150)
      },
      message: {
        allowNull: false,
        type: DataTypes.TEXT
      },
      langCode: {
        type: DataTypes.STRING(8)
      },
      // Note: in previous system the attachments were generated through timestamp and included identifiers of identifier batches
      // In new system no attachments are made. Identifier batches are made downloadable through the UI.
      hasAttachment: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0
      },
      attachmentName: {
        type: DataTypes.STRING(30),
        defaultValue: ''
      },
      sentBy: {
        type: DataTypes.STRING(30)
      }
    },
    {
      tableName: `${TABLE_PREFIX}_isbn_registry_message`,
      underscored: true,
      createdAt: 'sent',
      updatedAt: false
    }
  );
}
