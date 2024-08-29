import { HttpException, HttpStatus } from '@nestjs/common';
import { throwError } from 'rxjs';

export function handleError(statusCode: HttpStatus, errorMessage: string) {
  return throwError(
    () =>
      new HttpException(
        {
          statusCode,
          message: errorMessage,
        },
        statusCode,
      ),
  );
}
