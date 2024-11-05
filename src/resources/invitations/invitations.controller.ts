import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common'
import { Request } from 'express'
import { ApiResponse } from 'src/lib/responses/api-response'
import { IsAdmin } from '../auth/decorators/is-admin.decorator'
import { User } from '../users/entities/user.entity'
import { AcceptInvitationDto } from './dto/accept-invitation.dto'
import { AdminCreateInvitationDto } from './dto/admin-create-invitation.dto'
import { CreateInvitationDto } from './dto/create-invitation.dto'
import { Invitation } from './entities/invitation.entity'
import { InvitationsService } from './invitations.service'

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('/admin/send')
  @IsAdmin()
  async admin_createInvitation(@Body() dto: AdminCreateInvitationDto): Promise<ApiResponse<Invitation>> {
    return await this.invitationsService.admin_createInvitation(dto)
  }

  @Post('/send')
  async createInvitation(@Req() req: Request, @Body() dto: CreateInvitationDto): Promise<ApiResponse<Invitation>> {
    return await this.invitationsService.createInvitation(req.performer, dto)
  }

  @Get('/validate')
  async validateInvitation(@Query('token') token: string): Promise<ApiResponse<Invitation>> {
    return await this.invitationsService.validateInvitationToken(token)
  }

  @Post('/accept')
  async acceptInvitation(@Body() dto: AcceptInvitationDto): Promise<ApiResponse<User>> {
    return await this.invitationsService.acceptInvitation(dto)
  }
}
