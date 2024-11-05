import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ApiNotFoundException, ApiResponse } from 'src/lib/responses/api-response'
import { Performer } from 'src/lib/types/performer.type'
import { Between, Repository } from 'typeorm'
import { AssessmentMeeting } from '../assessments/entities/assessment-meeting.entity'
import { User } from '../users/entities/user.entity'
import { Tier } from './entities/tier.entity'

@Injectable()
export class TiersService {
  constructor(
    @InjectRepository(Tier) private readonly tiersRepository: Repository<Tier>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(AssessmentMeeting)
    private readonly assessmentMeetingsRepository: Repository<AssessmentMeeting>,
  ) {}

  async getTiers(performer: Performer): Promise<ApiResponse<Tier>> {
    const tier = await this.tiersRepository.findOne({
      where: {
        organization: {
          id: performer.organizationId,
        },
      },
    })

    if (!tier) {
      throw new ApiNotFoundException('Tier not found!')
    }

    const assessments = await this.assessmentMeetingsRepository.count({
      where: {
        assessment: {
          organization: {
            id: performer.organizationId,
          },
        },
        createdAt: Between(tier.createdAt, new Date()),
      },
    })

    const members = await this.usersRepository.count({
      where: {
        organization: {
          id: performer.organizationId,
        },
      },
    })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    if (tier.createdAt < thirtyDaysAgo) {
      return new ApiResponse({
        ...tier,
        membersPerOrganization: tier.membersPerOrganization - members,
        assessmentsPerMonth: tier.assessmentsPerMonth - assessments,
        isExpired: true,
      })
    }

    return new ApiResponse({
      ...tier,
      membersPerOrganization: tier.membersPerOrganization - members,
      assessmentsPerMonth: tier.assessmentsPerMonth - assessments,
      isExpired: false,
    })
  }
}
