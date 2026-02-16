// Expand Request type so that it may include user information
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Request {
      user?: {
        roles?: string[]; // These come from Keycloak
        applicationRoles?: string[]; // These are added by application logic
      };
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UnknownObject = Record<string, any>;
