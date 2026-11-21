export class ApiError extends Error {
  public readonly status: number;
  public readonly errorCode: string;
  public readonly detail: string;

  constructor(status: number, errorCode: string, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.detail = detail;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
