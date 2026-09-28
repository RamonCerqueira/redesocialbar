import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ALLOW_FIRST_ACCESS } from '../decorators/allow-first-access.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) { super(); }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authenticated = await super.canActivate(context);
    const user = context.switchToHttp().getRequest().user;
    const allowed = this.reflector.getAllAndOverride<boolean>(ALLOW_FIRST_ACCESS, [context.getHandler(), context.getClass()]);
    if (user?.mustChangePassword && !allowed) {
      throw new ForbiddenException({ code: 'PASSWORD_CHANGE_REQUIRED', message: 'Crie sua nova senha para continuar.' });
    }
    return Boolean(authenticated);
  }
}
