import { applyDecorators, SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles_required';
export const PERMS_KEY = 'perms_required';

export function Auth(roles: string[] = [], perms: string[] = []) {
  return applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    SetMetadata(PERMS_KEY, perms)
  );
}