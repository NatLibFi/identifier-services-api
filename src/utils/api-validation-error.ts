import HttpStatus from 'http-status';

export class ApiValidationError extends Error {
  status: number;
  errorMessages: string[];

  constructor(errorMessages: string[]) {
    super();
    this.status = HttpStatus.UNPROCESSABLE_ENTITY;
    this.errorMessages = errorMessages;
  }
}
