import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import * as isbnRangeInterface from '../../interfaces/monograph/isbn-range-interface.ts';

export async function readIsbnRanges(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await isbnRangeInterface.getIsbnRanges();
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function createIsbnRange(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await isbnRangeInterface.createIsbnRange(req.body, req.user);
    return res.status(HttpStatus.CREATED).json(result);
  } catch (error) {
    return next(error);
  }
}
