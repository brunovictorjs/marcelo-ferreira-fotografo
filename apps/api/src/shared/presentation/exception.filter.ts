import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ApiErrorBody } from '@mf/shared';
import type { Response } from 'express';
import { DomainError } from '../domain/domain-errors.js';

const STATUS_BY_KIND: Record<DomainError['kind'], number> = {
  validation: HttpStatus.UNPROCESSABLE_ENTITY,
  not_found: HttpStatus.NOT_FOUND,
  conflict: HttpStatus.CONFLICT,
  unauthorized: HttpStatus.UNAUTHORIZED,
  forbidden: HttpStatus.FORBIDDEN,
};

/** Traduz qualquer erro para o formato ApiErrorBody. */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ApiExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);
    if (body.statusCode >= 500) this.logger.error(exception);
    res.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ApiErrorBody {
    if (exception instanceof DomainError) {
      return {
        statusCode: STATUS_BY_KIND[exception.kind],
        code: exception.code,
        message: exception.message,
      };
    }
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();
      const obj = typeof response === 'object' && response ? (response as Record<string, unknown>) : {};
      const rawMessage = obj.message ?? exception.message;
      return {
        statusCode,
        code: typeof obj.code === 'string' ? obj.code : HttpStatus[statusCode] ?? 'ERROR',
        message: Array.isArray(rawMessage) ? String(rawMessage[0]) : typeof rawMessage === 'string' ? rawMessage : exception.message,
        ...(Array.isArray(obj.issues) ? { issues: obj.issues as ApiErrorBody['issues'] } : {}),
      };
    }
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Erro inesperado. Tente novamente.',
    };
  }
}
