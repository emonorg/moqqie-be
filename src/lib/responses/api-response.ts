import { BadRequestException, NotAcceptableException, NotFoundException, UnauthorizedException } from '@nestjs/common'

export class ApiError {
  constructor(
    public field: string,
    public message: string,
    public code?: string,
  ) {}
}
export class ApiResponse<T> {
  constructor(
    public data: T,
    public error: ApiError[] | null = null,
  ) {}
}

export interface PaginationStruct {
  limit: number
  page: number
  total: number
  totalPages: number
}
export class ApiPaginatedResponse<T> extends ApiResponse<T[]> {
  constructor(
    public data: T[],
    public pagination: PaginationStruct,
  ) {
    super(data, null)
  }
}

export class ApiSuccessResponse extends ApiResponse<undefined> {
  constructor() {
    super(undefined, null)
  }
}

export class ApiUnauthorizedException extends UnauthorizedException {
  constructor(message = 'Unauthorized!', code?: string) {
    super([{ field: 'global', message, code }])
  }
}

export class ApiBadRequestException extends BadRequestException {
  constructor(message = 'Bad Request!') {
    super([{ field: 'global', message }])
  }
}

export class ApiNotAcceptableException extends NotAcceptableException {
  constructor(message = 'Not Acceptable!') {
    super([{ field: 'global', message }])
  }
}

export class ApiNotFoundException extends NotFoundException {
  constructor(message = 'Not Found!') {
    super([{ field: 'global', message }])
  }
}
