import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
@Injectable()
export class AuthRateGuard implements CanActivate {
  private readonly attempts = new Map<string, { count: number; until: number }>();
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const now = Date.now();
    for (const [key, value] of this.attempts) if (value.until < now) this.attempts.delete(key);
    const key = String(request.ip || request.socket?.remoteAddress || 'unknown');
    const entry = this.attempts.get(key) || { count: 0, until: now + 60000 };
    if (entry.count >= 15 || this.attempts.size >= 10000) throw new HttpException('Muitas tentativas. Aguarde um minuto.', 429);
    entry.count++;
    this.attempts.set(key, entry);
    return true;
  }
}
