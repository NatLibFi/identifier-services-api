import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import * as issnRangeInterface from '../../interfaces/serial/issn-range-interface.ts';

export async function readIssnRanges(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await issnRangeInterface.getIssnRanges();
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function createIssnRange(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await issnRangeInterface.createIssnRange(req.body, req.user);
    return res.status(HttpStatus.CREATED).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function updateIssnRange(req: Request, res: Response, next: NextFunction) {
  try {
    await issnRangeInterface.updateIssnRange(Number(req.params['id']), req.body, req.user);
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}

export async function deleteIssnRange(req: Request, res: Response, next: NextFunction) {
  try {
    await issnRangeInterface.deleteIssnRange(Number(req.params['id']));
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}
