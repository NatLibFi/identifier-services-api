import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import * as monographIdentifierBatchInterface from '../../interfaces/monograph/monograph-identifier-batch-interface.ts';

export async function createMonographIdentifierBatch(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await monographIdentifierBatchInterface.createMonographIdentifierBatch(req.body, req.user);
    return res.status(HttpStatus.CREATED).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function deleteMonographIdentifierBatch(req: Request, res: Response, next: NextFunction) {
  try {
    await monographIdentifierBatchInterface.deleteMonographIdentifierBatch(Number(req.params['id']), req.user);
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}
