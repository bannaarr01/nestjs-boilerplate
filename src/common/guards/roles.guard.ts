import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
   constructor(private readonly reflector: Reflector) {}

   canActivate(context: ExecutionContext): boolean {
      const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
         context.getHandler(),
         context.getClass()
      ]);

      if (!requiredRoles || requiredRoles.length === 0) {
         return true;
      }

      const { user } = context.switchToHttp().getRequest();

      if (!user || !user.roles) {
         throw new ForbiddenException('User does not have the required roles');
      }

      const hasRole = requiredRoles.some(role => user.roles?.includes(role));

      if (!hasRole) {
         throw new ForbiddenException('User does not have the required roles');
      }

      return true;
   }
}


