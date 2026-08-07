import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import * as ismnPublisherRangeInterface from '../../interfaces/monograph/ismn-publisher-range-interface.ts';

export async function createIsmnRange(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ismnPublisherRangeInterface.createIsmnPublisherRange(req.body, req.user);
    return res.status(HttpStatus.CREATED).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function readIsmnPublisherRangePublicInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ismnPublisherRangeInterface.readIsmnPublisherRangePublicInfo(Number(req.params['id']));
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function deleteIsmnRange(req: Request, res: Response, next: NextFunction) {
  try {
    await ismnPublisherRangeInterface.deleteIsmnPublisherRange(Number(req.params['id']));
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}

export async function getIsmnPublisherRangeIdentifiers(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await ismnPublisherRangeInterface.getIsmnPublisherRangeIdentifiers(
      Number(req.params['id']),
      req.body,
      req.user,
    );

    if (req.body.download) {
      const fileName = `ismn-publisher-range-${req.params['id']}-identifiers.txt`;
      return res.attachment(fileName).send(result);
    }

    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}
