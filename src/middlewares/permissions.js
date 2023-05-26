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

export const permissions = {
  melinda: {
    create: [
      'admin',
      'system'
    ],
    read: [
      'admin',
      'system'
    ]
  },
  publishers: {
    create: [
      'admin',
      'system'
    ],
    read: ['all'], // Note, attributes are restricted for general public via filtering
    extendedQueries: [
      'admin',
      'system'
    ],
    update: [
      'admin',
      'system'
    ]
  },
  issnPublishers: {
    create: [
      'admin',
      'system'
    ],
    read: [
      'admin',
      'system'
    ],
    update: [
      'admin',
      'system'
    ],
    delete: [
      'admin',
      'system'
    ]
  },
  publisherRequests: {
    read: [
      'admin',
      'system'
    ],
    update: [
      'admin',
      'system'
    ],
    delete: [
      'admin',
      'system'
    ]
  },
  issnPublications: {
    create: [
      'admin',
      'system'
    ],
    read: [
      'admin',
      'system'
    ],
    update: [
      'system',
      'admin'
    ],
    delete: [
      'system',
      'admin'
    ]
  },
  publicationRequests: {
    create: [
      'admin',
      'system'
    ],
    read: [
      'admin',
      'system'
    ],
    update: [
      'admin',
      'system'
    ],
    delete: [
      'admin',
      'system'
    ],
    copy: [
      'system',
      'admin'
    ]
  },
  issnRequests: {
    read: [
      'admin',
      'system'
    ],
    update: [
      'system',
      'admin'
    ],
    delete: [
      'system',
      'admin'
    ]
  },
  ranges: {
    create: [
      'admin',
      'system'
    ],
    read: [
      'admin',
      'system'
    ],
    update: [
      'admin',
      'system'
    ],
    delete: [
      'admin',
      'system'
    ]
  },
  identifierBatches: {
    create: [
      'admin',
      'system'
    ],
    query: [
      'admin',
      'system'
    ],
    delete: [
      'admin',
      'system'
    ]
  },
  isbnIsmnIdentifiers: {
    delete: [
      'admin',
      'system'
    ]
  },
  issnIdentifiers: {
    create: [
      'admin',
      'system'
    ],
    delete: [
      'admin',
      'system'
    ]
  },
  messageType: {
    create: [
      'admin',
      'system'
    ],
    read: [
      'admin',
      'system'
    ],
    update: [
      'admin',
      'system'
    ],
    delete: [
      'admin',
      'system'
    ]
  },
  messageTemplate: {
    create: [
      'admin',
      'system'
    ],
    read: [
      'admin',
      'system'
    ],
    update: [
      'admin',
      'system'
    ],
    delete: [
      'admin',
      'system'
    ]
  },
  message: {
    send: [
      'admin',
      'system'
    ],
    read: [
      'admin',
      'system'
    ]
  },
  statistics: {
    read: [
      'admin',
      'system'
    ]
  },
  marc: {
    read: [
      'admin',
      'system'
    ]
  }
};
