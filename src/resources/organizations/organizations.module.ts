import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SlackModule } from 'nestjs-slack'
import { NotificationsModule } from '../notifications/notifications.module'
import { Tier } from '../subscription-tiers/entities/tier.entity'
import { DemoBooking } from './entities/demo-booking.entity'
import { Organization } from './entities/organization.entity'
import { OrganizationsController } from './organizations.controller'
import { OrganizationsService } from './organizations.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, Tier, DemoBooking]),
    NotificationsModule,
    SlackModule.forRoot({
      type: 'webhook',
      channels: [
        {
          name: 'demo-requests',
          url: '',
        },
      ],
    }),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [],
})
export class OrganizationsModule {}
