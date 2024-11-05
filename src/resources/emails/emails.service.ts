import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import * as amqp from 'amqplib'
import { Channel } from 'amqplib'
import { readFileSync } from 'fs'
import { Resend } from 'resend'
import { AmqpService } from 'src/lib/abstractions/amqp/amqp.service'
import { QueueBaseService, QueueName } from 'src/lib/abstractions/queue-base-service'
import { Repository } from 'typeorm'
import { Email, EmailType } from './entities/email.entity'

export interface SendInvitationEmailMessage {
  emailAddress: string
  organizationName: string
  invitationToken: string
}

export interface SendAssessmentEmailMessage {
  emailAddress: string
  organizationName: string
  assessmentTitle: string
  assessmentMeetingId: string
  password: string
  dueDate: string
}

@Injectable()
export class EmailsService extends QueueBaseService {
  private templates: Map<EmailType, string> = new Map()
  private resendClient!: Resend

  constructor(
    @InjectRepository(Email)
    private readonly emailsRepository: Repository<Email>,
    private readonly configsService: ConfigService,
    amqpService: AmqpService,
  ) {
    super(amqpService, configsService.getOrThrow('NODE_ENV'))
    super.registerQueues([
      {
        [QueueName.SendInvitationEmail]: {
          function: this.sendInvitationEmail.bind(this),
          interval: 100,
        },
      },
      {
        [QueueName.SendAssessmentEmail]: {
          function: this.sendAssessmentEmail.bind(this),
          interval: 100,
        },
      },
    ])

    this.loadTemplates()

    this.resendClient = new Resend(this.configsService.getOrThrow('RESEND_API_KEY'))
  }

  async sendAssessmentEmail(msg: amqp.ConsumeMessage, channel: Channel): Promise<void> {
    const message = JSON.parse(msg.content.toString()) as SendAssessmentEmailMessage

    const template = this.templates.get(EmailType.Assessment)

    if (!template) {
      Logger.error('Invitation email template not found', 'EmailsService')
      return
    }

    const content = template
      .replace('{{organizationName}}', message.organizationName)
      .replace(
        '{{assessmentLink}}',
        `${this.configsService.getOrThrow('FRONTEND_URL')}/assessment-meeting/${message.assessmentMeetingId}/join`,
      )
      .replace('{{assessmentTitle}}', message.assessmentTitle)
      .replace('{{password}}', message.password)
      .replace('{{dueDateTime}}', `${message.dueDate} Central European Time Zone`)

    this.emailsRepository.save(
      this.emailsRepository.create({
        emailAddress: message.emailAddress,
        subject: 'Assessment invitation',
        content,
      }),
    )

    const res = await this.resendClient.emails.send({
      from: 'Moqqie <no-reply-interviews@moqqie.com>',
      to: message.emailAddress,
      subject: 'Interview invitation',
      html: content,
    })

    if (res.error?.name) {
      Logger.error('Error sending email: ' + JSON.stringify(res.error))
    }

    channel.ack(msg)

    Logger.debug(`Assessment email sent to ${message.emailAddress}`, 'EmailsService')
  }

  async sendInvitationEmail(msg: amqp.ConsumeMessage, channel: Channel): Promise<void> {
    const message = JSON.parse(msg.content.toString()) as SendInvitationEmailMessage

    const template = this.templates.get(EmailType.Invitation)

    if (!template) {
      Logger.error('Invitation email template not found', 'EmailsService')
      return
    }

    const content = template
      .replace('{{organizationName}}', message.organizationName)
      .replace(
        '{{invitationAcceptLink}}',
        `${this.configsService.getOrThrow('FRONTEND_URL')}/auth/invitations/${message.invitationToken}`,
      )

    this.emailsRepository.save(
      this.emailsRepository.create({
        emailAddress: message.emailAddress,
        subject: 'Invitation to join organization',
        content,
      }),
    )

    await this.resendClient.emails.send({
      from: 'Moqqie <no-reply@moqqie.com>',
      to: message.emailAddress,
      subject: 'Invitation to join organization',
      html: content,
    })

    channel.ack(msg)

    Logger.debug(`Invitation email sent to ${message.emailAddress}`, 'EmailsService')
  }

  private async loadTemplates(): Promise<void> {
    this.templates.set(EmailType.Invitation, readFileSync('src/resources/emails/templates/invitation.html').toString())
    this.templates.set(EmailType.Assessment, readFileSync('src/resources/emails/templates/assessment.html').toString())
  }
}
