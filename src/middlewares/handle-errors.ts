import type { NextFunction, Request, Response } from 'express';
import HttpStatus from 'http-status';

import { getApplicationLogger } from '../utils/logging.ts';
import { ApiError } from '../utils/api-error.ts';
import { ApiValidationError } from '../utils/api-validation-error.ts';
import respondWithProblemDocument from '../utils/problem-json.ts';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function (error: Error, req: Request, res: Response, _next: NextFunction) {
  const logger = getApplicationLogger();

  if (error) {
    // If error was an already managed error, send defined status and message as response
    if (error instanceof ApiError) {
      logger.debug(`ApiError occurred with message: ${error.detail}`);
      const problemDocument = {
        type: error.type,
        status: error.status,
        title: error.title,
        detail: error.detail,
      };

      return respondWithProblemDocument(req, res, problemDocument);
    }

    if (error instanceof ApiValidationError) {
      const problemDocument = {
        type: 'about:blank',
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        title: 'Validation error',
        detail: error.errorMessages.join(', '),
      };

      logger.debug(`ApiValidationError occurred with message: ${problemDocument.detail}`);
      return respondWithProblemDocument(req, res, problemDocument);
    }

    // If error was an unmanaged error, respond with controlled unknown error status and log the error message
    logger.warn(`Error was not a managed one. The message produced by the error was: ${error.message}`);

    const problemDocument = {
      type: 'about:blank',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      title: 'Unknown error',
      detail: 'Error details are not known. If the error occurs again, please contact system administrators.',
    };

    return respondWithProblemDocument(req, res, problemDocument);
  }

  // This situation should not ever occur but just in case we define fallback of unknown error
  logger.warn(`Encountered unknown state for request to ${req.path}`);

  const problemDocument = {
    type: 'about:blank',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    title: 'Unknown error',
    detail: 'Error details are not known. If the error occurs again, please contact system administrators.',
  };

  return respondWithProblemDocument(req, res, problemDocument);
}
