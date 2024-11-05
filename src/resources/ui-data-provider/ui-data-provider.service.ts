import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ApiResponse } from 'src/lib/responses/api-response'
import { Performer } from 'src/lib/types/performer.type'
import { MoreThan, Repository } from 'typeorm'
import { AssessmentMeetingQuestion } from '../assessments/entities/assessment-meeting-questions.entity'
import { AssessmentMeeting } from '../assessments/entities/assessment-meeting.entity'
import { Assessment } from '../assessments/entities/assessment.entity'
import { Candidate } from '../candidates/entities/candidate.entity'

export interface OverviewData {
  assessments: number
  candidates: number
  meetings: number
  timesSaved: string
}

@Injectable()
export class UIDataProviderService {
  constructor(
    @InjectRepository(Assessment)
    private assessmentRepository: Repository<Assessment>,
    @InjectRepository(Candidate)
    private candidateRepository: Repository<Candidate>,
    @InjectRepository(AssessmentMeeting)
    private assessmentMeetingRepository: Repository<AssessmentMeeting>,
    @InjectRepository(AssessmentMeetingQuestion)
    private assessmentMeetingQuestionRepository: Repository<AssessmentMeetingQuestion>,
  ) {}

  async getOverviewData(performer: Performer): Promise<ApiResponse<OverviewData>> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const assessments = await this.assessmentRepository.count({
      where: {
        organization: {
          id: performer.organizationId,
        },
        createdAt: MoreThan(thirtyDaysAgo),
      },
    })

    const candidates = await this.candidateRepository.count({
      where: {
        organization: {
          id: performer.organizationId,
        },
      },
    })

    const meetings = await this.assessmentMeetingRepository.find({
      where: {
        assessment: {
          organization: { id: performer.organizationId },
          createdAt: MoreThan(thirtyDaysAgo),
        },
      },
      relations: { questions: true },
    })

    let totalMinutes = 0
    for (const meeting of meetings) {
      totalMinutes += meeting.questions.length * 3
    }

    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    const formattedTime = `${hours}h ${minutes}min`

    return new ApiResponse({
      assessments,
      candidates,
      meetings: meetings.length,
      timesSaved: formattedTime,
    })
  }
}
