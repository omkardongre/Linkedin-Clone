export interface HttpExceptionResponse {
  statusCode: number;
  message: string;
}

export interface CustomHTTPExceptionResponse extends HttpExceptionResponse {
  path: string;
  method: string;
  timestamp: Date;
}
