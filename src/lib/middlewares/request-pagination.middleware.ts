import { Injectable, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'

export interface PaginationQuery<T> {
  query: T
  sort: string
  order: string
  limit: number
  page: number
}

@Injectable()
export class RequestPaginationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    req.pagination = {} as PaginationQuery<{}>
    if (req.query.query) {
      const queries = (req.query.query as string).split(',') || ''
      req.pagination.query = queries.reduce((acc, query) => {
        const [key, value] = query.split(':')
        acc[key] = value
        return acc
      }, {})
    } else {
      req.pagination.query = {}
    }

    req.pagination.sort = (req.query.sort as string) || 'createdAt'
    req.pagination.order = (req.query.order as string) || 'DESC'
    req.pagination.limit = Number(req.query.limit) || 10
    req.pagination.page = Number(req.query.page) || 1

    next()
  }
}
