import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { PerformerRole } from 'src/lib/types/performer.type'

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isAdmin = this.reflector.get<boolean>('isAdmin', context.getHandler())

    const isCandidate = this.reflector.get<boolean>('isCandidate', context.getHandler())

    const request: Request = context.switchToHttp().getRequest()

    if (isAdmin && request.performer.role === PerformerRole.Admin) {
      return true
    }

    if (isCandidate && request.performer.role === PerformerRole.Candidate) {
      return true
    }

    if (!isAdmin && !isCandidate) {
      return true
    }

    return false
  }
}
