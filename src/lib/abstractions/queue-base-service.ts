import { Logger } from '@nestjs/common'
import * as amqp from 'amqplib'
import { AmqpService } from 'src/lib/abstractions/amqp/amqp.service'

export interface QueuePool {
  [key: string]: {
    function: (msg: amqp.ConsumeMessage | null) => void
    interval?: number
  }
}

export enum QueueName {
  SendInvitationEmail = 'b2b-send-invitation-email',
  SendAssessmentEmail = 'b2b-send-assessment-email',
  AnalyzeAssessment = 'b2b-analyze-assessment',
}

export class QueueBaseService {
  private static amqpChannel: amqp.Channel

  constructor(
    private readonly amqpService: AmqpService,
    public envName: string,
  ) {
    this.setupChannel()
  }

  async setupChannel(): Promise<void> {
    QueueBaseService.amqpChannel = await (await this.amqpService.getConnection()).createChannel()
    Logger.log('AMQP channel created', 'QueueBaseService')
  }

  async registerQueues(queuePool: QueuePool[]): Promise<void> {
    const amqpConnection = await this.amqpService.getConnection()

    for (const queue of queuePool) {
      const channel = await amqpConnection.createChannel()
      const queueName = this.envName + '-' + Object.keys(queue)[0]
      await channel.assertQueue(queueName, { durable: true })
      await channel.prefetch(1)
      await channel.consume(queueName, async (msg: amqp.ConsumeMessage | null) => {
        if (msg === null) {
          return
        }
        !Object.values(queue)[0].interval
          ? await Object.values(queue)[0].function.apply(this, [msg, channel])
          : setTimeout(async () => {
              await Object.values(queue)[0].function.apply(this, [msg, channel])
            }, Object.values(queue)[0].interval)
      })
      Logger.log(`Queue ${queueName} registered`, 'QueueBaseService')
    }
  }

  async sendToQueue<T>(queueName: string, message: T): Promise<void> {
    await QueueBaseService.amqpChannel.assertQueue(queueName, {
      durable: true,
    })
    await QueueBaseService.amqpChannel.sendToQueue(this.envName + '-' + queueName, Buffer.from(JSON.stringify(message)))
    Logger.debug(`Message sent to queue ${this.envName + '-' + queueName}`, 'QueueBaseService')
  }
}
