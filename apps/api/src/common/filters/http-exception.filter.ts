import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import * as crypto from 'crypto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const requestId = crypto.randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Something went wrong';
    let field: string | undefined = undefined;
    let resBody: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      resBody = exception.getResponse() as any;

      if (typeof resBody === 'object') {
        code = resBody.code || 'VALIDATION_ERROR';
        message = resBody.message || exception.message;
        field = resBody.field;
      } else {
        message = resBody || exception.message;
      }
    } else {
      // Logic error or database crash
      this.logger.error(`Unhandled exception [Request ID: ${requestId}]: ${exception.message}`, exception.stack);
      
      // Enforce zero leak of stack traces or internals in production
      if (process.env.NODE_ENV !== 'production') {
        message = exception.message || String(exception);
      }
    }

    const errorResponse: any = {
      success: false,
      error: {
        code,
        message: Array.isArray(message) ? message[0] : message, // handle class-validator array
        field,
      },
      request_id: requestId,
    };

    if (typeof resBody === 'object') {
      for (const key in resBody) {
        if (!['code', 'message', 'field', 'statusCode', 'error'].includes(key)) {
          errorResponse[key] = resBody[key];
        }
      }
    }

    response.status(status).json(errorResponse);
  }
}
