import * as xl from 'excel4node';

export function formatStatisticsToXlsx(statisticsType, jsonData) {
  const wb = new xl.Workbook({author: 'National Library of Finland'});
  writeDataToSheet(statisticsType, jsonData, wb);

  return wb;

  function writeDataToSheet(statisticsType, jsonData, wb) {
    // Most statistics workbooks require only one worksheet
    const ws = wb.addWorksheet(statisticsType);

    if (statisticsType.startsWith('ISBN_REGISTRY_PROGRESS_')) {
      return writeIsbnRegistryProgressStatistics(jsonData, ws);
    }

    if (statisticsType.startsWith('ISBN_REGISTRY_PUBLISHERS_') || statisticsType.startsWith('ISBN_REGISTRY_PUBLICATIONS_')) {
      return writeData(jsonData, ws, []);
    }

    if (statisticsType === 'ISBN_REGISTRY_MONTHLY') {
      return writeIsbnRegistryMonthlyStatistics(jsonData, ws);
    }

    if (statisticsType === 'ISSN_REGISTRY_ISSN') {
      const ws2 = wb.addWorksheet(statisticsType);
      return writeIssnRegistryIssnStatistics(jsonData, ws, ws2);
    }

    if (statisticsType === 'ISSN_REGISTRY_PUBLISHERS') {
      return writeIssnRegistryPublisherStatistics(jsonData, ws);
    }

    if (statisticsType === 'ISSN_REGISTRY_PUBLICATIONS') {
      return writeIssnRegistryPublicationStatistics(jsonData, ws);
    }

    if (statisticsType === 'ISSN_REGISTRY_FORMS') {
      return writeIssnRegistryFormStatistics(jsonData, ws);
    }

    return;
  }
}

function writeIsbnRegistryProgressStatistics(jsonData, ws) {
  const numberDataHeaders = ['vapaana', 'käytetty'];
  return writeData(jsonData, ws, numberDataHeaders);
}

function writeIsbnRegistryMonthlyStatistics(jsonData, ws) {
  // For monthly statistics all but 'Tilaston tyyppi' values are numeric
  const numberDataHeaders = Object.keys(jsonData[0]).filter(key => key !== 'Tilaston tyyppi');
  return writeData(jsonData, ws, numberDataHeaders);
}

function writeIssnRegistryIssnStatistics(jsonData, ws, ws2) {
  const [sheetData1, sheetData2] = jsonData.sheets;

  const numberDataHeaders1 = ['Annettu', 'Vapaana', 'Yht.'];
  writeData(sheetData1, ws, numberDataHeaders1);

  const numberDataHeaders2 = ['Lukumäärä'];
  writeData(sheetData2, ws2, numberDataHeaders2);
}

function writeIssnRegistryPublisherStatistics(jsonData, ws) {
  const numberDataHeaders = Object.keys(jsonData[0]).filter(key => key !== 'Aktiviteetin tyyppi');
  return writeData(jsonData, ws, numberDataHeaders);
}

function writeIssnRegistryPublicationStatistics(jsonData, ws) {
  const numberDataHeaders = Object.keys(jsonData[0]).filter(key => key !== 'Julkaisun tila');
  return writeData(jsonData, ws, numberDataHeaders);
}

function writeIssnRegistryFormStatistics(jsonData, ws) {
  const numberDataHeaders = ['Määrä'];
  return writeData(jsonData, ws, numberDataHeaders);
}

function writeData(jsonData, ws, numberDataHeaders) {
  // Data must be in format of array of objects
  if (!canGenerateXlsx(jsonData)) {
    return;
  }

  // First objects attributes are used as headers
  const headers = Object.keys(jsonData[0]);

  // Columns generation loop
  headers.forEach((header, idx) => {
    const columnIdx = idx + 1;
    ws.cell(1, columnIdx)
      .string(String(header))
      .style({font: {bold: true}});

    // Rows generation loop
    /* eslint-disable functional/no-conditional-statements*/
    jsonData.forEach((entry, entryIdx) => {
      // Row number is entryIdx + 2 since entryIdx indexing starts at 0 and in first index is the header
      const rowIdx = entryIdx + 2;

      if (numberDataHeaders.includes(header)) {
        ws.cell(rowIdx, columnIdx).number(Number(entry[header]));
      } else {
        ws.cell(rowIdx, columnIdx).string(String(entry[header]));
      }
    });
    /* eslint-enable functional/no-conditional-statements*/
  });

  return ws;

  function canGenerateXlsx(jsonData) {
    return Array.isArray(jsonData) && jsonData.length > 0 && typeof jsonData[0] === 'object';
  }
}
