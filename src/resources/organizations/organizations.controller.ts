import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common'
import { Request } from 'express'
import { IsAdmin } from '../auth/decorators/is-admin.decorator'
import { BookDemoDto } from './dtos/book-demo.dto'
import { CreateOrganizationDto } from './dtos/create-organization.dto'
import { OrganizationsService } from './organizations.service'

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @IsAdmin()
  async createOrganization(@Body() dto: CreateOrganizationDto) {
    return this.organizationsService.admin_createOrganization(dto)
  }

  @Get()
  async getOrganizationInfo(@Req() request: Request) {
    return this.organizationsService.getOrganizationInfo(request.performer)
  }

  @Post('book-demo')
  async bookDemo(@Body() dto: BookDemoDto) {
    return this.organizationsService.bookDemo(dto)
  }

  @Post('revoke-membership')
  async revokeMembership(@Query('memberId') userId: string, @Req() request: Request) {
    return this.organizationsService.revokeMembership(request.performer, userId)
  }
}
