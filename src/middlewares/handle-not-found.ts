import type { NextFunction, Request, Response } from 'express';
import HttpStatus from 'http-status';

import { getApplicationLogger } from '../utils/logging.ts';
import respondWithProblemDocument from '../utils/problem-json.ts';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function (req: Request, res: Response, _next: NextFunction) {
  const logger = getApplicationLogger();

  logger.info(`Resource not found: ${req.path}`);

  const problemDocument = {
    type: 'about:blank',
    status: HttpStatus.NOT_FOUND,
    title: 'Not found',
    detail: `Requested resource ${req.path} was not found.`,
  };

  return respondWithProblemDocument(req, res, problemDocument);
}
