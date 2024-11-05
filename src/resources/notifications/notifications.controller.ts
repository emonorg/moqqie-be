import { Controller, Get, Req } from '@nestjs/common'
import { Request } from 'express'
import { NotificationsService } from './notifications.service'

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Req() request: Request) {
    return this.notificationsService.getNotifications(request.performer)
  }
}
