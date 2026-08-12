import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import * as messageTemplateInterface from '../interfaces/message-template-interface.ts';
import { ApiError } from '../utils/api-error.ts';

export async function getMessageTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const getParams = {
      message_type: req.query['message_type'],
      lang_code: req.query['lang_code'],
    };

    if (typeof getParams.message_type !== 'string' || typeof getParams.lang_code !== 'string') {
      throw new ApiError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        'Unprocessable entity',
        'message_type and lang_code must be of string type',
      );
    }

    // @ts-expect-error types have been checked in runtime (and also by validation)
    const result = await messageTemplateInterface.getMessageTemplate(getParams);
    return res.status(HttpStatus.OK).json(result);
  } catch (error) {
    return next(error);
  }
}

export async function updateMonographPublication(req: Request, res: Response, next: NextFunction) {
  try {
    await messageTemplateInterface.updateMessageTemplate(Number(req.params['id']), req.body, req.user);
    return res.status(HttpStatus.NO_CONTENT).end();
  } catch (error) {
    return next(error);
  }
}
