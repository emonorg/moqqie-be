import { Injectable, NestMiddleware } from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import { ApiUnauthorizedException } from 'src/lib/responses/api-response'
import { AuthService } from '../auth.service'

@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const accessToken = req.cookies?.accessToken

    if (!accessToken) {
      throw new ApiUnauthorizedException()
    }

    const performer = await this.authService.getPerformerByAccessToken(accessToken)

    if (!performer.userId) {
      throw new ApiUnauthorizedException()
    }

    req.performer = performer
    req.accessToken = accessToken

    next()
  }
}
