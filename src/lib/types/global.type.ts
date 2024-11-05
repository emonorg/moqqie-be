import { PaginationQuery } from '../middlewares/request-pagination.middleware'
import { Performer } from './performer.type'

/* eslint-disable @typescript-eslint/no-namespace */
export {}

declare global {
  namespace Express {
    interface Request {
      performer: Performer
      accessToken: string
      pagination: PaginationQuery<any>
    }
  }
}
