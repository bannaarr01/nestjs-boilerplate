import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Injectable, UnauthorizedException } from '@nestjs/common';

function resolveJwtSecret(): string {
   const secret = process.env.JWT_SECRET;

   if (secret && secret.trim().length > 0) {
      return secret;
   }

   if ((process.env.NODE_ENV || '').toLowerCase() === 'test') {
      return 'test-only-jwt-secret';
   }

   throw new Error('JWT_SECRET is required');
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
   constructor() {
      super({
         jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
         ignoreExpiration: false,
         secretOrKey: resolveJwtSecret()
      });
   }

   async validate(payload: JwtPayload) {
      if (!payload.sub || !payload.email) {
         throw new UnauthorizedException('Invalid token');
      }

      return {
         sub: payload.sub,
         email: payload.email,
         roles: payload.roles || [],
         permissions: payload.permissions || []
      };
   }
}

