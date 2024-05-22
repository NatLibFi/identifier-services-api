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

export default {
  searchText: /^[a-zA-Z.@0-9]+$/u,
  numberString: /^[0-9]+$/u,
  yearString: /^[0-9]{4}$/u,
  monthString: /^0[1-9]{1}$|^1[0-2]{1}$/u,
  dateString: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u,
  email: /^[a-zA-Z0-9._%+-]{1,64}@[a-z0-9.-]{1,200}\.[a-z]{2,5}$/u,
  langCode: /^fi-FI$|^en-GB$|^sv-SE$/u,
  publishingActivity: /^OCCASIONAL$|^CONTINUOUS$/u,
  publicationType: /^BOOK$|^DISSERTATION$|^SHEET_MUSIC$|^MAP$|^OTHER$/u,
  publicationFormat: /^PRINT$|^ELECTRONICAL$|^PRINT_ELECTRONICAL$/u,
  authorRoles: /^AUTHOR$|^ILLUSTRATOR$|^TRANSLATOR$|^EDITOR$/u,
  publicationEditionString: /^[0-9]{1}$|^[1-9]{1}[0-9]{1}$/u,
  publicationPrintType: /^PAPERBACK$|^HARDBACK$|^SPIRAL_BINDING$|^OTHER_PRINT$/u,
  publicationElectronicalType: /^PDF$|^EPUB$|^CD_ROM$|^MP3$|^OTHER$/u,
  publicationLanguage: /^FIN$|^SWE$|^ENG$|^SMI$|^SPA$|^FRE$|^GER$|^RUS$|^MUL$/u,
  publicationIssn: /^\d{4}-\d{3}[0-9X]{1}$/u,
  publicationState: /^NEW$|^IN_PROCESS$|^ACCEPTED$|^REJECTED$/u,
  publisherIdentifierIsbn: /^(?:[0-9]{1,8}|can_[0-9]{1,10})$/u,
  statisticsTypesIsbn: /^MONTHLY$|^PROGRESS_ISBN$|^PROGRESS_ISMN$|^PUBLISHERS_ISBN$|^PUBLICATIONS_ISBN$|^PUBLISHERS_ISMN$|^PUBLICATIONS_ISMN$|^PUBLISHERS_ISBN_UNIQUE$|^PUBLISHERS_ISMN_UNIQUE$/u,
  statisticsTypesIssn: /^ISSN$|^PUBLISHERS$|^PUBLICATIONS$|^FORMS$/u,
  statisticsFormats: /^json$|^xlsx$|^csv$/u,
  issnPublicationType: /^JOURNAL$|^NEWSLETTER$|^STAFF_MAGAZINE$|^MEMBERSHIP_BASED_MAGAZINE$|^CARTOON$|^NEWSPAPER$|^FREE_PAPER$|^MONOGRAPHY_SERIES$|^OTHER_SERIAL$/u,
  issnMedium: /^PRINTED$|^ONLINE$|^CDROM$|^OTHER$/u,
  issnLanguages: /^FIN$|^SWE$|^ENG$|^SMI$|^SPA$|^FRE$|^RUS$|^GER$|^MUL$/u,
  issnNumber: /^[0-9]{4}-[0-9]{3}[0-9X]{1}$/ui,
  issnFrequency: /[afqbmwdk#z]{1}/u,
  issnRequestStatus: /^NOT_HANDLED$|^NOT_NOTIFIED$|^COMPLETED$|^REJECTED$/u,
  issnPublicationStatus: /^NO_ISSN_GRANTED$|^NO_PREPUBLICATION_RECORD$|^ISSN_FROZEN$|^WAITING_FOR_CONTROL_COPY$|^COMPLETED$/u,
  isbnOrIsmnIdentifier: /^97(?:8|9)-(?:0|951|952)-[0-9]{1,7}-[0-9]{1,5}-[0-9]{1}$/u,
  marcFormats: /^text$|^json$|^iso2709$/u
};
