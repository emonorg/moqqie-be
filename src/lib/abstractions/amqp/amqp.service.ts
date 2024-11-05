import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as amqp from 'amqplib'

@Injectable()
export class AmqpService {
  private amqpConnection!: amqp.Connection

  constructor(private readonly configsService: ConfigService) {}

  async getConnection(): Promise<amqp.Connection> {
    if (!this.amqpConnection) {
      this.amqpConnection = await amqp.connect(this.configsService.getOrThrow('RABBIT_URI'))
    }
    return this.amqpConnection
  }
}
