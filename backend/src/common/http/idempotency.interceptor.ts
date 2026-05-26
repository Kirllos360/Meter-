import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../database/prisma.service';
import { IdempotencyRecord, Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const method = request.method as string;

    if (!this.mutationMethods.includes(method)) {
      return next.handle();
    }

    const idempotencyKey = request.headers['idempotency-key'] as string | undefined;
    if (!idempotencyKey) {
      return next.handle();
    }

    const actor = request.user?.id ?? 'anonymous';
    const route = request.route?.path ?? request.path ?? '/';
    const scopedKey = `${actor}:${route}:${method}:${idempotencyKey}`;

    return this.handleIdempotentRequest(scopedKey, request, response, next);
  }

  private handleIdempotentRequest(
    scopedKey: string,
    request: any,
    response: any,
    next: CallHandler,
  ): Observable<unknown> {
    const existing = this.prisma.idempotencyRecord.findUnique({
      where: { key: scopedKey },
    });

    return new Observable<unknown>((subscriber) => {
      existing
        .then((record: IdempotencyRecord | null) => {
          if (record) {
            response.status(record.responseStatus);
            subscriber.next(record.responseBody);
            subscriber.complete();
            return;
          }

          next.handle().subscribe({
            next: (body) => {
              this.cacheResponse(scopedKey, request, response, body);
              subscriber.next(body);
            },
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        })
        .catch(() => {
          next.handle().subscribe({
            next: (body) => subscriber.next(body),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        });
    });
  }

  private async cacheResponse(
    scopedKey: string,
    request: any,
    response: any,
    body: unknown,
  ): Promise<void> {
    const method = request.method as string;
    const route = request.route?.path ?? request.path ?? '/';
    const actor = request.user?.id ?? 'anonymous';
    const requestHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(request.body ?? {}))
      .digest('hex');

    try {
      await this.prisma.idempotencyRecord.create({
        data: {
          key: scopedKey,
          method,
          route,
          actor,
          requestHash,
          responseBody: body as Prisma.InputJsonValue,
          responseStatus: response.statusCode,
        },
      });
    } catch {
      // Cache write failure must not fail the original request
    }
  }
}
