import type { ApplicationRoleMap } from '../app.ts';
import { APPLICATION_ROLES } from '../constants.ts';

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
export function isAdmin(user: Record<string, any> | undefined) {
  if (!user || !hasRequiredProperties(user)) {
    return false;
  }

  const userApplicationRoles = user['applicationRoles'] || [];
  const hasAdminRole = userApplicationRoles.includes(APPLICATION_ROLES.ADMIN);
  return hasAdminRole;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPublisher(user: Record<string, any> | undefined) {
  if (!user || !hasRequiredProperties(user)) {
    return false;
  }

  const userApplicationRoles = user['applicationRoles'] || [];
  const hasPublisherRole = userApplicationRoles.includes(APPLICATION_ROLES.PUBLISHER);
  return hasPublisherRole;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPublisherOrAdmin(user: Record<string, any> | undefined) {
  return isAdmin(user) || isPublisher(user);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hasRequiredProperties(user: Record<string, any> | undefined) {
  const userInfoExists = user && typeof user === 'object';
  if (!userInfoExists) {
    return false;
  }

  const requiredProperties = ['id', 'applicationRoles'];
  const userProperties = Object.keys(user);
  const userHasRequiredProperties = requiredProperties.every((property) => userProperties.includes(property));

  if (!userHasRequiredProperties) {
    return false;
  }

  const userId = user['id'];
  const userIdIsValid = typeof userId === 'string' && userId.length > 0 && userId.length < 37;

  return userIdIsValid;
}
