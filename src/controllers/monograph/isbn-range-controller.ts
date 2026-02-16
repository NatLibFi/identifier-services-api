import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import * as isbnRangeInterface from '../../interfaces/monograph/isbn-range.ts';

export async function readIsbnRanges(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await isbnRangeInterface.getIsbnRanges();
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}
