import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { PaginationQuery } from 'src/lib/middlewares/request-pagination.middleware'
import {
  ApiNotAcceptableException,
  ApiNotFoundException,
  ApiPaginatedResponse,
  ApiResponse,
} from 'src/lib/responses/api-response'
import { Performer } from 'src/lib/types/performer.type'
import { Like, Repository } from 'typeorm'
import { AssessmentMeeting } from '../assessments/entities/assessment-meeting.entity'
import { CreateCandidateDto } from './dtos/create-candidate.dto'
import { UpdateCandidateDto } from './dtos/update-candidate.dto'
import { Candidate } from './entities/candidate.entity'

@Injectable()
export class CandidatesService {
  constructor(
    @InjectRepository(Candidate)
    private candidatesRepository: Repository<Candidate>,
    @InjectRepository(AssessmentMeeting)
    private assessmentMeetingsRepository: Repository<AssessmentMeeting>,
  ) {}

  async create(performer: Performer, dto: CreateCandidateDto): Promise<ApiResponse<Candidate>> {
    const candidate = await this.candidatesRepository.findOne({
      where: {
        emailAddress: dto.emailAddress,
        organization: { id: performer.organizationId },
      },
    })

    if (candidate) {
      throw new ApiNotAcceptableException('Candidate already exists!')
    }

    const savedCandidate = await this.candidatesRepository.save(
      this.candidatesRepository.create({
        emailAddress: dto.emailAddress,
        fullName: dto.fullName,
        notes: dto.notes,
        organization: { id: performer.organizationId },
      }),
    )

    return new ApiResponse(savedCandidate)
  }

  async getCandidates(
    performer: Performer,
    pagination: PaginationQuery<{ emailAddress: string }>,
  ): Promise<ApiResponse<Candidate[]>> {
    const candidates = await this.candidatesRepository.find({
      where: {
        organization: { id: performer.organizationId },
        emailAddress: Like(`%${pagination.query.emailAddress || ''}%`),
      },
      order: { [pagination.sort]: pagination.order },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    })

    const total = await this.candidatesRepository.count({
      where: {
        organization: { id: performer.organizationId },
        emailAddress: Like(`%${pagination.query.emailAddress || ''}%`),
      },
    })

    return new ApiPaginatedResponse(candidates, {
      limit: pagination.limit,
      page: pagination.page,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    })
  }

  async getCandidate(performer: Performer, id: string): Promise<ApiResponse<Candidate>> {
    const candidate = await this.candidatesRepository.findOne({
      where: { id, organization: { id: performer.organizationId } },
    })

    if (!candidate) {
      throw new ApiNotAcceptableException('Candidate not found!')
    }

    return new ApiResponse(candidate)
  }

  async updateCandidate(performer: Performer, id: string, dto: UpdateCandidateDto): Promise<ApiResponse<Candidate>> {
    const candidate = await this.candidatesRepository.findOne({
      where: { id, organization: { id: performer.organizationId } },
    })

    if (!candidate) {
      throw new ApiNotAcceptableException('Candidate not found!')
    }

    if (dto.emailAddress) {
      candidate.emailAddress = dto.emailAddress
    }

    if (dto.fullName) {
      candidate.fullName = dto.fullName
    }

    if (dto.notes) {
      candidate.notes = dto.notes
    }

    const updatedCandidate = await this.candidatesRepository.save(candidate)

    return new ApiResponse(updatedCandidate)
  }

  async getCandidateAssessmentMeetings(performer: Performer, candidateId: string): Promise<ApiResponse<AssessmentMeeting[]>> {
    const candidate = await this.candidatesRepository.findOne({
      where: {
        id: candidateId,
        organization: { id: performer.organizationId },
      },
    })

    if (!candidate) {
      throw new ApiNotFoundException('Candidate not found!')
    }

    const assessmentMeetings = await this.assessmentMeetingsRepository.find({
      where: {
        candidate: { id: candidate.id },
      },
      relations: { candidate: true, assessment: true },
    })

    return new ApiResponse(assessmentMeetings)
  }
}
