interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: number;
    details?: any;
  };
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export class ResponseUtil {
  static success<T>(data: T, message?: string): SuccessResponse<T> {
    return {
      success: true,
      data,
      message,
    };
  }

  static error(message: string, code?: number, details?: any): ErrorResponse {
    return {
      success: false,
      error: {
        message,
        code,
        details,
      },
    };
  }
}
