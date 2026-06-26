import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from './interfaces';
import { UserAccessService } from './user-access.service';

@Injectable()
export class AreaGuard implements CanActivate {
  constructor(private readonly userAccess: UserAccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload; userAccess?: any; areaId?: string }>();
    const user = request.user;

    if (!user) return true;

    let access = request.userAccess;
    if (!access) {
      access = await this.userAccess.resolveAccess(user.userId || user.sub, user.role);
      request.userAccess = access;
    }

    const requestedArea = request.headers['x-area-id'] as string | undefined;

    if (requestedArea) {
      const hasAccess = access.isSuperAdmin || access.areas?.includes(requestedArea);
      if (!hasAccess) throw new ForbiddenException(`Access denied for area: ${requestedArea}`);
      request.areaId = requestedArea;
    }

    return true;
  }
}
