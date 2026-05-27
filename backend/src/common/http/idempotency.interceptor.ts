import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, from, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

const UNIQUE_CONSTRAINT_CODE = 'P2002';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotencyInterceptor.name);
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

    return from(
      this.prisma.idempotencyRecord.findUnique({ where: { key: scopedKey } }),
    ).pipe(
      switchMap((record) => {
        if (record) {
          response.status(record.responseStatus);
          return of(record.responseBody);
        }
        return this.executeAndCache(scopedKey, request, response, next);
      }),
      catchError((err) => {
        this.logger.error(`Idempotency check failed: ${err}`);
        return next.handle();
      }),
    );
  }

  private executeAndCache(
    scopedKey: string,
    request: any,
    response: any,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      switchMap((body) =>
        from(this.tryCache(scopedKey, request, response, body)).pipe(
          map((cached) => {
            if (cached) {
              response.status(cached.responseStatus);
              return cached.responseBody;
            }
            return body;
          }),
        ),
      ),
    );
  }

  private async tryCache(
    scopedKey: string,
    request: any,
    response: any,
    body: unknown,
  ): Promise<{ responseStatus: number; responseBody: unknown } | null> {
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
      return null;
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as Record<string, unknown>).code === UNIQUE_CONSTRAINT_CODE
      ) {
        const existing = await this.prisma.idempotencyRecord.findUniqueOrThrow({
          where: { key: scopedKey },
        });
        return {
          responseStatus: existing.responseStatus,
          responseBody: existing.responseBody,
        };
      }
      this.logger.error(`Idempotency cache failed: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }
}
