import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, PERMS_KEY } from '../decorators/auth.decorator';

@Injectable()
export class RolesPermsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const rolesReq = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]) || [];
    const permsReq = this.reflector.getAllAndOverride<string[]>(PERMS_KEY, [ctx.getHandler(), ctx.getClass()]) || [];

    if (!rolesReq.length && !permsReq.length) return true;
  
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as { roles?: string[]; perms?: string[] };

    if (!user) return false;

    const hasRoles = rolesReq.every(r => user?.roles?.includes(r));
    const hasPerms = permsReq.every(p => user?.perms?.includes(p));
    return hasRoles && hasPerms;
  }
}