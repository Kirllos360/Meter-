import type { ErrorEnvelope } from './client';

export class ApiError extends Error {
  public readonly code: string;
  public readonly correlationId: string;
  public readonly details?: unknown;
  public readonly statusCode: number;

  constructor(envelope: ErrorEnvelope, statusCode: number) {
    super(envelope.message);
    this.name = 'ApiError';
    this.code = envelope.code;
    this.correlationId = envelope.correlationId;
    this.details = envelope.details;
    this.statusCode = statusCode;
  }

  get isServerError(): boolean {
    return this.statusCode >= 500;
  }

  get isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  get isValidationError(): boolean {
    return this.statusCode === 400 || this.statusCode === 422;
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  get isConflict(): boolean {
    return this.statusCode === 409;
  }
}

export async function parseApiError(response: Response): Promise<ApiError> {
  let envelope: ErrorEnvelope;
  try {
    const body = await response.json();
    if (body && typeof body.code === 'string' && typeof body.correlationId === 'string') {
      envelope = body as ErrorEnvelope;
    } else {
      envelope = {
        code: 'ApiError',
        message: body?.message ?? `Request failed with status ${response.status}`,
        correlationId: response.headers.get('x-correlation-id') ?? crypto.randomUUID(),
        details: body,
      };
    }
  } catch {
    envelope = {
      code: 'ApiError',
      message: `Request failed with status ${response.status}`,
      correlationId: response.headers.get('x-correlation-id') ?? crypto.randomUUID(),
    };
  }
  return new ApiError(envelope, response.status);
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
