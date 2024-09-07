import {
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as fs from 'fs';
import {
  CustomHTTPExceptionResponse,
  HttpExceptionResponse,
} from './model/http-exception-response';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: Error, host: import('@nestjs/common').ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse();
    const request: Request = ctx.getRequest();
    let status: HttpStatus;
    let errorMessage: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorMessage =
        (exception.getResponse() as HttpExceptionResponse).message ||
        exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorMessage = exception.message || 'Internal Server Error';
    }
    const errorResponse: CustomHTTPExceptionResponse = this.getErrorResponse(
      status,
      errorMessage,
      request,
    );
    const errorLog: string = this.getErrorLog(
      errorResponse,
      request,
      exception,
    );
    this.writeErrorLogToFile(errorLog);
    response.status(status).json(errorResponse);
  }

  private getErrorResponse = (
    status: HttpStatus,
    errorMessage: string,
    request: Request,
  ): CustomHTTPExceptionResponse => ({
    statusCode: status,
    message: errorMessage,
    path: request.url,
    method: request.method,
    timestamp: new Date(),
  });

  private getErrorLog = (
    errorResponse: CustomHTTPExceptionResponse,
    request: Request,
    exception: unknown,
  ): string => {
    const { statusCode, message, path, method } = errorResponse;
    const errorLog = `Response Code ${statusCode} - Method ${method} -URL ${path}\n
    ${JSON.stringify(errorResponse)}\n
    User: ${JSON.stringify(request.user ?? 'Not signed in')}\n
    ${exception instanceof HttpException ? exception.stack : message}\n
    `;
    return errorLog;
  };

  private writeErrorLogToFile(errorLog: string) {
    fs.appendFile('error.log', errorLog, (err) => {
      if (err) {
        throw err;
      }
    });
  }
}
