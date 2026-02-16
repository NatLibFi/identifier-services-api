import type { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';

import type { ApplicationRoleMap } from '../app.ts';
import { getApplicationRoles, isAdmin } from '../utils/permission-utils.ts';
import { ApiError } from '../utils/api-error.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateAuthenticationMiddleware(passportMiddlewares: any) {
  return authenticate;

  // Passes request to passport authentication function if authorization header is available
  // Strategy and authentication function is chosen based on the process runtime env
  // If authorization is not available, req.user is set to undefined
  function authenticate(req: Request, res: Response, next: NextFunction) {
    if ('authorization' in req.headers) {
      return passportMiddlewares.token(req, res, next);
    }

    return next();
  }
}

export function generateRoleMapMiddleware(applicationRoleMap: ApplicationRoleMap) {
  return addUserApplicationRoles;

  function addUserApplicationRoles(req: Request, _res: Response, next: NextFunction) {
    const passportAuthenticationWasSuccessful = req.user && req.user.roles && Array.isArray(req.user.roles);

    if (passportAuthenticationWasSuccessful) {
      // @ts-expect-error typescript does not understand intermediate variable passportAuthenticationWasSuccessful
      const userApplicationRoles = getApplicationRoles(req.user.roles, applicationRoleMap);

      // @ts-expect-error typescript does not understand intermediate variable passportAuthenticationWasSuccessful
      req.user.applicationRoles = userApplicationRoles;
    }

    return next();
  }
}

export function allowAdminOnly(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    throw new ApiError(
      HttpStatus.UNAUTHORIZED,
      'Unauthorized',
      'The requested operation is not permitted for unauthorized users.',
    );
  }

  if (isAdmin(req.user)) {
    return next();
  }

  throw new ApiError(
    HttpStatus.FORBIDDEN,
    'Forbidden',
    'You do not have permission to perform the requested operation.',
  );
}
