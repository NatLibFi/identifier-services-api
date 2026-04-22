import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import * as isbnPublisherRangeInterface from '../../interfaces/monograph/isbn-publisher-range-interface.ts';

export async function createIsbnRange(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await isbnPublisherRangeInterface.createIsbnPublisherRange(req.body, req.user);
    return res.status(HttpStatus.CREATED).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function deleteIsbnRange(req: Request, res: Response, next: NextFunction) {
  try {
    await isbnPublisherRangeInterface.deleteIsbnPublisherRange(Number(req.params['id']));
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}

export async function getIsbnPublisherRangeIdentifiers(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await isbnPublisherRangeInterface.getIsbnPublisherRangeIdentifiers(
      Number(req.params['id']),
      req.body,
    );

    if (req.body.download) {
      const fileName = `isbn-publisher-range-${req.params['id']}-${req.body.offset}-${req.body.offset + req.body.limit}.txt`;
      return res.attachment(fileName).send(result);
    }

    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}
