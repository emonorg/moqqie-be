import { Controller, Get, Req } from '@nestjs/common'
import { Request } from 'express'
import { UIDataProviderService } from './ui-data-provider.service'

@Controller('ui-data-provider')
export class UIDataProviderController {
  constructor(private readonly uiDataProviderService: UIDataProviderService) {}

  @Get('overview')
  async getOverviewData(@Req() request: Request) {
    return this.uiDataProviderService.getOverviewData(request.performer)
  }
}
