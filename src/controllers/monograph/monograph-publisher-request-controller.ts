import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import * as monographPublisherRequestInterface from '../../interfaces/monograph/monograph-publisher-request-interface.ts';

export async function createMonographPublisherRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographPublisherRequestInterface.createMonographPublisherRequest(req.body, req.user);
    return res.status(HttpStatus.CREATED).json(result);
  } catch (error) {
    return next(error);
  }
}
