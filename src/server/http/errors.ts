import 'server-only';

/**
 * Domain errors. Route handlers throw these; the central handler
 * wrapper (`createHandler`) converts them into HTTP responses with the
 * standard envelope.
 */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Array<{ path?: string; code: string; message: string }>;

  constructor(
    status: number,
    code: string,
    message: string,
    options: { details?: HttpError['details']; cause?: unknown } = {},
  ) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = options.details;
  }
}

export class BadRequestError extends HttpError {
  constructor(message = 'Bad request', details?: HttpError['details']) {
    super(400, 'BAD_REQUEST', message, { details });
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = 'You do not have permission to do this') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = 'Resource already exists') {
    super(409, 'CONFLICT', message);
  }
}

export class UnprocessableError extends HttpError {
  constructor(message: string, details?: HttpError['details']) {
    super(422, 'UNPROCESSABLE_ENTITY', message, { details });
  }
}

export class RateLimitedError extends HttpError {
  constructor(message = 'Too many requests', retryAfterSeconds?: number) {
    super(429, 'RATE_LIMITED', message);
    if (retryAfterSeconds) {
      (this as unknown as { retryAfter: number }).retryAfter = retryAfterSeconds;
    }
  }
}

export class InternalError extends HttpError {
  constructor(message = 'Something went wrong on our end') {
    super(500, 'INTERNAL_ERROR', message);
  }
}
