export interface HttpExceptionResponse {
  statusCode: number;
  error: string;
}

export interface CustomHTTPExceptionResponse extends HttpExceptionResponse {
  path: string;
  method: string;
  timestamp: Date;
}
