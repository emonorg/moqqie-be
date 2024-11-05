import { RequestMethod } from '@nestjs/common'

export const CorsURLs = ['http://localhost:3001', 'https://app.moqqie.com', 'https://moqqie.com']

export const AuthenticationExcludedRoutes = [
  { path: '/auth/sign-in', method: RequestMethod.POST },
  { path: '/auth/sign-up', method: RequestMethod.POST },
  { path: '/health-check', method: RequestMethod.GET },
  { path: '/auth/forget-password', method: RequestMethod.POST },
  { path: '/auth/validate-reset-password-code', method: RequestMethod.POST },
  { path: '/auth/reset-password', method: RequestMethod.POST },
  { path: '/auth/admin/sign-in', method: RequestMethod.POST },
  { path: '/auth/candidate/sign-in', method: RequestMethod.POST },
  { path: '/invitations/validate', method: RequestMethod.GET },
  { path: '/invitations/accept', method: RequestMethod.POST },
  { path: '/organizations/book-demo', method: RequestMethod.POST },
]
