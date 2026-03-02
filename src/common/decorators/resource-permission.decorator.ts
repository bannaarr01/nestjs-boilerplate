import { SetMetadata } from '@nestjs/common';

export const RESOURCE_PERMISSION_KEY = 'resource_permission';

export const ResourcePermission = (resource: string, scope: string) =>
   SetMetadata(RESOURCE_PERMISSION_KEY, [`${resource}:${scope}`]);

export const ResourcePermissions = (permissions: Array<{ resource: string; scope: string }>) => {
   const permissionStrings = permissions.map(permission => `${permission.resource}:${permission.scope}`);
   return SetMetadata(RESOURCE_PERMISSION_KEY, permissionStrings);
};


