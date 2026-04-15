/**
 * lib/errors.ts — Centralized error taxonomy for GymMitra ERP
 *
 * All typed errors in one place. Each error carries a statusCode
 * so API routes can respond with the correct HTTP status automatically.
 */

export class AppError extends Error {
    public readonly statusCode: number
    public readonly code: string

    constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
        super(message)
        Object.setPrototypeOf(this, new.target.prototype)
        this.name = this.constructor.name
        this.statusCode = statusCode
        this.code = code
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Not found') {
        super(message, 404, 'NOT_FOUND')
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED')
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden') {
        super(message, 403, 'FORBIDDEN')
    }
}

export class ValidationError extends AppError {
    public readonly fields?: Record<string, string>

    constructor(message: string = 'Validation failed', fields?: Record<string, string>) {
        super(message, 400, 'VALIDATION_ERROR')
        this.fields = fields
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Conflict') {
        super(message, 409, 'CONFLICT')
    }
}

export class RateLimitError extends AppError {
    public readonly retryAfter: number

    constructor(message: string = 'Rate limit exceeded', retryAfter: number = 60) {
        super(message, 429, 'RATE_LIMITED')
        this.retryAfter = retryAfter
    }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
    return error instanceof AppError
}
