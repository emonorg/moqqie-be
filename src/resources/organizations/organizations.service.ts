import { InjectRepository } from '@nestjs/typeorm'
import { SlackService } from 'nestjs-slack'
import { ApiNotAcceptableException, ApiResponse, ApiSuccessResponse } from 'src/lib/responses/api-response'
import { Performer } from 'src/lib/types/performer.type'
import { Repository } from 'typeorm'
import { NotificationsService } from '../notifications/notifications.service'
import { Tier } from '../subscription-tiers/entities/tier.entity'
import { BookDemoDto } from './dtos/book-demo.dto'
import { CreateOrganizationDto } from './dtos/create-organization.dto'
import { DemoBooking } from './entities/demo-booking.entity'
import { Organization } from './entities/organization.entity'

export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(Tier)
    private readonly tiersRepository: Repository<Tier>,
    @InjectRepository(DemoBooking)
    private readonly demoBookingsRepository: Repository<DemoBooking>,
    private readonly nfService: NotificationsService,
    private slackService: SlackService,
  ) {}

  async revokeMembership(performer: Performer, userId: string): Promise<ApiSuccessResponse> {
    const organization = await this.organizationRepository.findOne({
      where: { id: performer.organizationId },
      relations: { members: true },
    })

    if (!organization) {
      throw new ApiNotAcceptableException('Organization not found!')
    }

    if (organization.members.length === 1) {
      throw new ApiNotAcceptableException('Cannot remove the last member!')
    }

    const user = organization.members.find((member) => member.id === userId)

    if (!user) {
      throw new ApiNotAcceptableException('User not found!')
    }

    await this.organizationRepository.save({
      ...organization,
      members: organization.members.filter((member) => member.id !== userId),
    })

    return new ApiSuccessResponse()
  }

  async admin_createOrganization(dto: CreateOrganizationDto): Promise<ApiResponse<Organization>> {
    const existingOrganization = await this.organizationRepository.findOne({
      where: { name: dto.name },
    })

    if (existingOrganization) {
      throw new ApiNotAcceptableException('The name is not acceptable! Please try another name.')
    }

    const organization = await this.organizationRepository.save(this.organizationRepository.create(dto))

    const newTier = await this.tiersRepository.save(
      this.tiersRepository.create({
        organization: { id: organization.id },
        assessmentsPerMonth: dto.assessmentsPerMonth,
        questionsPerAssessment: dto.questionsPerAssessment,
        membersPerOrganization: dto.membersPerOrganization,
      }),
    )

    organization.tier = newTier
    await this.organizationRepository.save(organization)

    this.nfService.addNotification(
      { organizationId: organization.id },
      {
        title: 'Welcome to the platform!',
        description: 'We are happy to have you here!',
        category: 'Support',
      },
    )

    return new ApiResponse(organization)
  }

  async getOrganizationInfo(performer: Performer): Promise<ApiResponse<Organization>> {
    const organization = await this.organizationRepository.findOne({
      where: { id: performer.organizationId },
      relations: { tier: true, members: true },
    })

    if (!organization) {
      throw new ApiNotAcceptableException('Organization not found!')
    }

    return new ApiResponse(organization)
  }

  async bookDemo(dto: BookDemoDto): Promise<ApiSuccessResponse> {
    await this.demoBookingsRepository.save(this.demoBookingsRepository.create(dto))

    this.slackService.postMessage({
      text: `😍 New demo request received! \n First name: ${dto.firstName} \n Last name: ${dto.lastName} \n Email: ${dto.emailAddress} \n Phone: ${dto.phoneNumber} \n Organization: ${dto.organizationName} \n`,
      channel: 'demo-requests',
    })

    return new ApiSuccessResponse()
  }
}
