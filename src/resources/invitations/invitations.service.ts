import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { AmqpService } from 'src/lib/abstractions/amqp/amqp.service'
import { QueueBaseService } from 'src/lib/abstractions/queue-base-service'
import { ApiNotAcceptableException, ApiNotFoundException, ApiResponse } from 'src/lib/responses/api-response'
import { Performer } from 'src/lib/types/performer.type'
import { Repository } from 'typeorm'
import { NotificationsService } from '../notifications/notifications.service'
import { Organization } from '../organizations/entities/organization.entity'
import { Tier } from '../subscription-tiers/entities/tier.entity'
import { User, UserAccountStatus } from '../users/entities/user.entity'
import { AcceptInvitationDto } from './dto/accept-invitation.dto'
import { AdminCreateInvitationDto } from './dto/admin-create-invitation.dto'
import { CreateInvitationDto } from './dto/create-invitation.dto'
import { Invitation, InvitationStatus } from './entities/invitation.entity'

@Injectable()
export class InvitationsService extends QueueBaseService {
  constructor(
    @InjectRepository(Tier)
    private readonly tiersRepository: Repository<Tier>,
    @InjectRepository(Invitation)
    private readonly invitationsRepository: Repository<Invitation>,
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configsService: ConfigService,
    amqpService: AmqpService,
    private readonly nfService: NotificationsService,
  ) {
    super(amqpService, configsService.getOrThrow('NODE_ENV'))
  }

  async defineInvitation(emailAddress: string, organizationId: string): Promise<Invitation> {
    const user = await this.usersRepository.findOne({
      where: {
        organization: { id: organizationId },
        emailAddress: emailAddress,
      },
    })

    if (user) {
      throw new ApiNotAcceptableException('User is already part of the organization!')
    }

    const invitation = await this.invitationsRepository.findOne({
      where: {
        organization: { id: organizationId },
        emailAddress: emailAddress,
        status: InvitationStatus.Pending,
      },
    })

    const organization = await this.organizationsRepository.findOne({
      where: { id: organizationId },
    })

    if (!organization) {
      throw new ApiNotFoundException('Organization not found!')
    }

    const tier = await this.tiersRepository.findOne({
      where: { organization: { id: organizationId } },
    })

    if (!tier) {
      throw new ApiNotFoundException('Tier not found!')
    }

    if (
      tier.membersPerOrganization <=
      (await this.usersRepository.count({
        where: { organization: { id: organizationId } },
      }))
    ) {
      throw new ApiNotAcceptableException('Upgrade your tier to add more members! Please contact support.')
    }

    // If invitation exists and has not expired, update expiration date
    if (invitation) {
      // delete the existing invitation
      await this.invitationsRepository.delete({ id: invitation.id })
    }

    const token = crypto
      .randomBytes(Math.ceil((64 * 3) / 4))
      .toString('base64')
      .slice(0, 64)
      .replace(/\+/g, '0')
      .replace(/\//g, '0')

    // check if generated token is unique in db
    const tokenExists = await this.invitationsRepository.findOne({
      where: { invitationToken: token },
    })

    if (tokenExists) {
      return await this.defineInvitation(emailAddress, organizationId)
    }

    const newInvitation = await this.invitationsRepository.save(
      this.invitationsRepository.create({
        emailAddress: emailAddress,
        organization: { id: organizationId },
        expiresAt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
        invitationToken: token,
      }),
    )

    super.sendToQueue('b2b-send-invitation-email', {
      emailAddress: emailAddress,
      organizationName: organization.name,
      invitationToken: token,
    })

    return newInvitation
  }

  async createInvitation(performer: Performer, dto: CreateInvitationDto): Promise<ApiResponse<Invitation>> {
    const invitation = await this.defineInvitation(dto.emailAddress, performer.organizationId!)

    return new ApiResponse(invitation)
  }

  async admin_createInvitation(dto: AdminCreateInvitationDto): Promise<ApiResponse<Invitation>> {
    const invitation = await this.defineInvitation(dto.emailAddress, dto.organizationId)
    return new ApiResponse<Invitation>(invitation)
  }

  async validateInvitationToken(invitationToken: string): Promise<ApiResponse<Invitation>> {
    const invitation = await this.invitationsRepository.findOne({
      where: {
        invitationToken,
        status: InvitationStatus.Pending,
      },
    })

    if (!invitation) {
      throw new ApiNotFoundException('Invitation not found!')
    }

    if (invitation.expiresAt < new Date()) {
      throw new ApiNotAcceptableException('Invitation has expired!')
    }

    return new ApiResponse<Invitation>(invitation)
  }

  async acceptInvitation(dto: AcceptInvitationDto): Promise<ApiResponse<User>> {
    const invitation = await this.invitationsRepository.findOne({
      where: {
        invitationToken: dto.token,
        status: InvitationStatus.Pending,
      },
      relations: { organization: true },
    })

    if (!invitation) {
      throw new ApiNotFoundException('Invitation not found!')
    }

    if (invitation.expiresAt < new Date()) {
      throw new ApiNotAcceptableException('Invitation has expired!')
    }

    const organization = await this.organizationsRepository.findOne({
      where: { id: invitation.organization.id },
    })

    if (!organization) {
      throw new ApiNotFoundException('Organization not found!')
    }

    const existingUser = await this.usersRepository.findOne({
      where: { emailAddress: invitation.emailAddress },
    })

    if (existingUser) {
      throw new ApiNotAcceptableException('User already exists!')
    }

    const user = await this.usersRepository.save(
      this.usersRepository.create({
        emailAddress: invitation.emailAddress,
        passwordHash: await bcrypt.hash(dto.password, 10),
        displayName: dto.displayName,
        organization: { id: organization.id },
        accountStatus: UserAccountStatus.Active,
      }),
    )

    invitation.status = InvitationStatus.Accepted
    await this.invitationsRepository.save(invitation)

    this.nfService.addNotification(
      { organizationId: organization.id },
      {
        title: 'New member joined!',
        description: `${user.displayName} (${user.emailAddress} ) has joined the organization!`,
        category: 'Support',
      },
    )

    return new ApiResponse<User>(user)
  }
}
