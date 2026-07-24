import HttpStatus from 'http-status';

import { createMelindaApiRecordClient } from '@natlibfi/melinda-rest-api-client';

import { ApiError } from '../utils/api-error.ts';
import { MARC_RECORD_FORMAT } from '../constants.ts';

import { createMonographPublicationExpressionMarc } from './monograph/monograph-publication-expression-interface.ts';

import type { MelindaConfiguration } from '../app.ts';
import type { UnknownObject } from '../generic-types.ts';
import type { SendToMelindaHttp } from '../validations/melinda-validation.ts';
import { isAutomatedTest } from '../utils/generic-utils.ts';

interface MelindaSaveResult {
  success_info?: UnknownObject;
  error?: string;
}

export default function createMelindaInterface(melindaConfiguration: MelindaConfiguration) {
  const apiClient = createMelindaApiRecordClient({
    melindaApiUrl: melindaConfiguration.MELINDA_API_URL,
    melindaApiUsername: melindaConfiguration.MELINDA_API_USER,
    melindaApiPassword: melindaConfiguration.MELINDA_API_PASSWORD,
  });

  async function sendToMelinda(recordOpts: SendToMelindaHttp) {
    const { monograph_expression_id, record_filter } = recordOpts;

    let records: UnknownObject[] = [];
    if (monograph_expression_id) {
      // @ts-expect-error string would be returned only using MARC_RECORD_FORMAT.TEXT
      records = await createMonographPublicationExpressionMarc(monograph_expression_id, {
        record_format: MARC_RECORD_FORMAT.MARC_RECORD_JS,
        record_filter,
      });
    }

    // Sanity check: records are defined
    if (records.length === 0) {
      throw new ApiError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Unprocessable entity',
        'No records was produces with given configuration',
      );
    }

    // TODO: integration test mocks. For now, just verify the endpoint properly responds after creating the MARC record.
    if (isAutomatedTest()) {
      return { this_integration_test_needs_more_work: true };
    }

    const results: MelindaSaveResult[] = [];

    if (!apiClient) {
      throw new ApiError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Internal server error',
        'Melinda API client definitions are missing from Identifier Services API. Please contact system administration.',
      );
    }

    await Promise.all(
      records.map(async (record) => {
        try {
          const melindaApiResponse: UnknownObject = await apiClient.create(record, { unique: 1, merge: 0 });
          results.push({ success_info: melindaApiResponse });
        } catch (error) {
          if (error instanceof Error) {
            results.push({ error: error.message });
          } else {
            results.push({ error: 'Unknown error occurred' });
          }
        }
      }),
    );

    return results;
  }

  return { sendToMelinda };
}
