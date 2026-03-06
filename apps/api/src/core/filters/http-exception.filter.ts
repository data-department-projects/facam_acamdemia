/**
 * Filtre global des exceptions HTTP.
 * Formate les réponses d'erreur de manière uniforme (message, statusCode, error).
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErreurReponse {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = this.extraireMessage(exception);
    const body: ErreurReponse = {
      statusCode: status,
      message,
      error: exception instanceof HttpException ? exception.name : 'Erreur interne',
      path: request.url,
      timestamp: new Date().toISOString(),
    };
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status}`,
        exception instanceof Error ? exception.stack : undefined
      );
    }
    response.status(status).json(body);
  }

  private extraireMessage(exception: unknown): string | string[] {
    if (exception instanceof HttpException) {
      const reponse = exception.getResponse();
      if (typeof reponse === 'object' && reponse !== null && 'message' in reponse) {
        return (reponse as { message: string | string[] }).message;
      }
      return exception.message;
    }
    if (exception instanceof Error) {
      return exception.message;
    }
    return 'Erreur inconnue';
  }
}
