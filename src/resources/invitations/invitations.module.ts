import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AmqpModule } from 'src/lib/abstractions/amqp/amqp.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { Organization } from '../organizations/entities/organization.entity'
import { Tier } from '../subscription-tiers/entities/tier.entity'
import { User } from '../users/entities/user.entity'
import { Invitation } from './entities/invitation.entity'
import { InvitationsController } from './invitations.controller'
import { InvitationsService } from './invitations.service'

@Module({
  imports: [TypeOrmModule.forFeature([Invitation, Organization, User, Tier]), AmqpModule, NotificationsModule],
  controllers: [InvitationsController],
  providers: [InvitationsService],
})
export class InvitationsModule {}
