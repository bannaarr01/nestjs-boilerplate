export interface AuthUser {
   exp: number;
   iat: number;
   jti?: string;
   iss: string;
   aud: string | string[];
   sub: string;
   typ?: string;
   azp?: string;
   sid?: string;
   acr?: string;
   scope?: string;
   name?: string;
   given_name?: string;
   family_name?: string;
   email?: string;
   email_verified?: boolean;
   preferred_username?: string;
   realm_access?: {
      roles: string[];
   };
   resource_access?: {
      [resourceName: string]: {
         roles: string[];
      };
   };
}
