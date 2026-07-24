import type { ApplicationRoleMap } from '../app.ts';
import { APPLICATION_ROLES } from '../constants.ts';

interface RequestUser {
  id: null | string;
  applicationRoles: string[];
}

export function getApplicationRoles(userKeycloakRoles: string[], applicationRolemap: ApplicationRoleMap) {
  const userApplicationRoles: string[] = [];

  // Not widely used syntax in this codebase, see:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in
  for (const applicationRole in applicationRolemap) {
    // The next roles are the ones that should be mapped to the application role that is currently in loop
    const keycloakRoles = applicationRolemap[applicationRole] || [];
    const userHasApplicationRole = keycloakRoles.some((keycloakRole) => userKeycloakRoles.includes(keycloakRole));

    if (userHasApplicationRole) {
      userApplicationRoles.push(applicationRole);
    }
  }

  return userApplicationRoles;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isAdmin(user: Record<string, any> | undefined): boolean {
  const { applicationRoles } = getRequestUser(user);
  const hasAdminRole = applicationRoles.length > 0 && applicationRoles.includes(APPLICATION_ROLES.ADMIN);
  return hasAdminRole;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPublisher(user: Record<string, any> | undefined) {
  const { applicationRoles } = getRequestUser(user);
  const hasPublisherRole = applicationRoles.length > 0 && applicationRoles.includes(APPLICATION_ROLES.PUBLISHER);
  return hasPublisherRole;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isGuest(user: Record<string, any> | undefined) {
  const { applicationRoles } = getRequestUser(user);
  return applicationRoles.length === 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPublisherOrAdmin(user: Record<string, any> | undefined) {
  return isAdmin(user) || isPublisher(user);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getRequestUser(user: Record<string, any> | undefined): RequestUser {
  const guestUser: RequestUser = { id: null, applicationRoles: [] };

  const userInfoExists = user && typeof user === 'object';

  if (!userInfoExists) {
    return guestUser;
  }

  const requiredProperties = ['id', 'applicationRoles'];
  const userProperties = Object.keys(user);
  const userHasRequiredProperties = requiredProperties.every((property) => userProperties.includes(property));

  if (!userHasRequiredProperties) {
    return guestUser;
  }

  const userApplicationRoles = user['applicationRoles'];
  const userRolesAreValid =
    userApplicationRoles &&
    Array.isArray(userApplicationRoles) &&
    userApplicationRoles.every((role) => typeof role === 'string' && role.length > 0);

  if (!userRolesAreValid) {
    return guestUser;
  }

  const userId = user['id'];
  const userIdIsValid = typeof userId === 'string' && userId.length > 0 && userId.length < 37;
  if (!userIdIsValid) {
    return guestUser;
  }

  return {
    id: userId,
    applicationRoles: userApplicationRoles,
  };
}
