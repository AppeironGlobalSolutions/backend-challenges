/**
 * Custom error type to encapsulate service-level errors with HTTP codes.
 */
export class ApiError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }

  static badRequest(message: string, details?: any) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message: string = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static notFound(message: string = 'Not Found') {
    return new ApiError(404, message);
  }

  static conflict(message: string, details?: any) {
    return new ApiError(409, message, details);
  }

  static internal(message: string = 'Internal Server Error', details?: any) {
    return new ApiError(500, message, details);
  }

  static outsideServiceWindow() {
    return new ApiError(
      422,
      'Specified window lies outside service hours',
      'outside_service_window'
    );
  }
}
