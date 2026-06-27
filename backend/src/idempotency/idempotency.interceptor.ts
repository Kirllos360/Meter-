import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ConflictException
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, from, tap, switchMap, throwError } from 'rxjs';
import { IdempotencyService } from './idempotency.service';

const IDEMPOTENT_METHODS = new Set(['POST', 'PUT', 'PATCH']);

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly service: IdempotencyService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method.toUpperCase();

    if (!IDEMPOTENT_METHODS.has(method)) {
      return next.handle();
    }

    const idempotencyKey = (req.headers['x-idempotency-key'] as string) || '';
    if (!idempotencyKey) {
      return next.handle();
    }

    const actor = (req as any).user?.userId || 'anonymous';
    const route = req.originalUrl || req.url;
    const scopedKey = `${actor}:${method}:${route}:${idempotencyKey}`;

    return from(this.service.findByKey(scopedKey)).pipe(
      switchMap((existing) => {
        if (existing && existing.responseStatus > 0) {
          return throwError(
            () => new ConflictException('Idempotency conflict: request already processed')
          );
        }
        if (!existing) {
          return from(this.service.createRecord(scopedKey, method, route, actor)).pipe(
            switchMap(() => next.handle())
          );
        }
        return next.handle();
      }),
      tap({
        next: (responseBody: unknown) => {
          const res = context.switchToHttp().getResponse();
          this.service.setResponse(scopedKey, responseBody, res.statusCode);
        }
      })
    );
  }
}
