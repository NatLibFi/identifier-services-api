import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import * as monographPublicationRequestInterface from '../../interfaces/monograph/monograph-publication-request-interface.ts';

export async function readMonographPublicationRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublicationRequestInterface.readMonographPublicationRequest(Number(req.params['id']));
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}
