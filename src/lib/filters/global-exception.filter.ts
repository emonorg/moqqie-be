import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Response } from 'express'
import { ApiResponse } from '../responses/api-response'

export interface Error {
  response: ErrorResponse
  status: number
  message: string
  name: string
}

export interface ErrorResponse {
  message: Message[]
  error: string
  statusCode: number
}

export interface Message {
  field: string
  message: string
}

export const getStatusCode = (exception: unknown): number => {
  return exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
}

export const getErrorMessage = (exception: unknown): string => {
  return String(exception)
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const code = getStatusCode(exception)

    Logger.error(exception)

    try {
      if (exception.response.message[0].field === 'global') {
        return response.status(code).json(
          new ApiResponse(null, [
            {
              field: 'global',
              message: exception.response.message[0].message,
            },
          ]),
        )
      }

      if (exception.response.statusCode === 403) {
        return response.status(code).json(
          new ApiResponse(null, [
            {
              field: 'global',
              message: 'Forbidden!',
            },
          ]),
        )
      }

      return response.status(code).json(
        new ApiResponse(
          null,
          exception.response.message.map((m) => ({
            field: m.field,
            message: m.message,
          })),
        ),
      )
    } catch (e) {
      console.log(e)
      return response.status(code).json(new ApiResponse(null, [{ field: 'global', message: 'Something went wrong!' }]))
    }
  }
}
