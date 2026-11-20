/** Errore HTTP tipizzato restituito dal backend FastAPI di Cogito (o dal mock layer). */
export class ApiError extends Error {
  public readonly status: number;
  public readonly errorCode: string;

  constructor(status: number, errorCode: string, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
  }
}
