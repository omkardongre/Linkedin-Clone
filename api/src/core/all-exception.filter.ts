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
  catch(
    exception: unknown,
    host: import('@nestjs/common').ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const response: Response = ctx.getResponse();
    const request: Request = ctx.getRequest();

    let status: HttpStatus;
    let errorMessage: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorMessage =
        (exception.getResponse() as HttpExceptionResponse).error ||
        exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorMessage = 'Internal server error';
    }
    const errorResponse = this.getErrorResponse(status, errorMessage, request);
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
    error: errorMessage,
    path: request.url,
    method: request.method,
    timestamp: new Date(),
  });

  private getErrorLog = (
    errorResponse: CustomHTTPExceptionResponse,
    request: Request,
    exception: unknown,
  ): string => {
    const { statusCode, error, path, method } = errorResponse;
    const errorLog = `Response Code ${statusCode} - Method ${method} -URL ${path}\n
    ${JSON.stringify(errorResponse)}\n
    User: ${JSON.stringify(request.user ?? 'Not signed in')}\n
    ${exception instanceof HttpException ? exception.stack : error}\n
    `;

    console.log('7', errorLog);
    return errorLog;
  };

  private writeErrorLogToFile(errorLog: string) {
    console.log('file is written');
    fs.appendFile('error.log', errorLog, (err) => {
      if (err) {
        throw err;
      }
    });
  }
}
