import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

export default function () {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentTypeMatches = req.is('application/json');
    const requestHasNoBody = req.body === undefined;

    if (contentTypeMatches || requestHasNoBody) {
      return next();
    }

    return res.sendStatus(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
  };
}
