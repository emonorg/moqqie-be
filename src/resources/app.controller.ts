import { Controller, Get } from '@nestjs/common'
import { HealthCheckResponse } from '../lib/types/health-check-response.type'
import { AppService } from './app.service'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health-check')
  healthCheck(): HealthCheckResponse {
    return {
      status: 'ok',
      message: 'Service is running',
    }
  }
}
