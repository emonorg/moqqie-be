import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ApiResponse } from 'src/lib/responses/api-response'
import { Performer } from 'src/lib/types/performer.type'
import { Repository } from 'typeorm'
import { Notification } from './entities/notification.entity'

export interface NotificationData {
  category: string
  title: string
  description: string
  referenceId?: string
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
  ) {}

  async addNotification(performer: Partial<Performer>, data: NotificationData) {
    return this.notificationsRepository.save(
      this.notificationsRepository.create({
        ...data,
        organization: { id: performer.organizationId },
      }),
    )
  }

  async getNotifications(performer: Performer): Promise<ApiResponse<Notification[]>> {
    const notifications = await this.notificationsRepository.find({
      where: {
        organization: {
          id: performer.organizationId,
        },
      },
      order: {
        createdAt: 'DESC',
      },
      take: 5,
    })

    return new ApiResponse(notifications)
  }
}
