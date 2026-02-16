import HttpStatus from 'http-status';

export class ApiError extends Error {
  type: string;
  status: number;
  title: string;
  detail: string;

  constructor(status: number, title: string, detail?: string, type?: string) {
    super(title);
    this.type = type ?? 'about:blank';
    this.status = status ?? HttpStatus.INTERNAL_SERVER_ERROR;
    this.title = title ?? 'Unknown error occurred';
    this.detail = detail ?? '';
  }
}
