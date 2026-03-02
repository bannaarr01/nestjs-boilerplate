import { Reflector } from '@nestjs/core';
import { RESOURCE_PERMISSION_KEY } from '../decorators/resource-permission.decorator';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class ResourcePermissionGuard implements CanActivate {
   constructor(private readonly reflector: Reflector) {}

   canActivate(context: ExecutionContext): boolean {
      const requiredPermissions = this.reflector.getAllAndOverride<string[]>(RESOURCE_PERMISSION_KEY, [
         context.getHandler(),
         context.getClass()
      ]);

      if (!requiredPermissions || requiredPermissions.length === 0) {
         return true;
      }

      const { user } = context.switchToHttp().getRequest();

      if (!user || !user.permissions) {
         throw new ForbiddenException('User does not have the required permissions');
      }

      const hasPermission = requiredPermissions.some(required => user.permissions?.includes(required));

      if (!hasPermission) {
         throw new ForbiddenException('User does not have the required permissions');
      }

      return true;
   }
}


