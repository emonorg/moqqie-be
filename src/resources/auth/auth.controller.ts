import { Body, Controller, Delete, Get, Post, Req, Res } from '@nestjs/common'
import { Request, Response } from 'express'
import { ApiResponse, ApiSuccessResponse } from 'src/lib/responses/api-response'
import { Admin } from '../admins/entities/admin.entity'
import { User } from '../users/entities/user.entity'
import { AuthService } from './auth.service'
import { IsAdmin } from './decorators/is-admin.decorator'
import { CandidateSignInDto } from './dtos/candidate-sign-in.dto'
import { AdminSignInDto } from './dtos/general-sign-in.dto'
import { ImpersonateUserDto } from './dtos/impersonate-user.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/me')
  async me(@Req() req: Request): Promise<ApiResponse<User | Admin>> {
    return this.authService.me(req.performer)
  }

  @Delete('/sign-out')
  async signOut(@Res({ passthrough: true }) response: Response): Promise<ApiSuccessResponse> {
    return this.authService.signOut(response)
  }

  @Post('/admin/sign-in')
  async admin_signIn(@Body() dto: AdminSignInDto, @Res({ passthrough: true }) response: Response): Promise<ApiResponse<Admin>> {
    return this.authService.admin_signIn(dto, response)
  }

  @Post('/sign-in')
  async user_signIn(@Body() dto: AdminSignInDto, @Res({ passthrough: true }) response: Response): Promise<ApiSuccessResponse> {
    return this.authService.user_signIn(dto, response)
  }

  @Post('/candidate/sign-in')
  async candidate_signIn(
    @Body() dto: CandidateSignInDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiSuccessResponse> {
    return this.authService.candidate_signIn(dto, response)
  }

  @IsAdmin()
  @Post('/admin/impersonate-user')
  async impersonateUser(
    @Body() dto: ImpersonateUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiSuccessResponse> {
    return this.authService.admin_impersonate(dto, response)
  }
}
