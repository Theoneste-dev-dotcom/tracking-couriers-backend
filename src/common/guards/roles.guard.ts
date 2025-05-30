import { CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import { Role } from '../../common/enums/role.enum';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
   if(user) {
    console.log(user)
   }else {
    console.log("We have no user")
   }
    return requiredRoles.includes(user.role);
  }
}
