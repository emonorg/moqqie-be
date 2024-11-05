import { Controller, Get, Req } from '@nestjs/common'
import { Request } from 'express'
import { ApiResponse } from 'src/lib/responses/api-response'
import { Tier } from './entities/tier.entity'
import { TiersService } from './tiers.service'

@Controller('tiers')
export class TiersController {
  constructor(private readonly tiersService: TiersService) {}

  @Get()
  async getTiers(@Req() req: Request): Promise<ApiResponse<Tier>> {
    return await this.tiersService.getTiers(req.performer)
  }
}
