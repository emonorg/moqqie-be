import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AssessmentMeetingQuestion } from '../assessments/entities/assessment-meeting-questions.entity'
import { AssessmentMeeting } from '../assessments/entities/assessment-meeting.entity'
import { Assessment } from '../assessments/entities/assessment.entity'
import { Candidate } from '../candidates/entities/candidate.entity'
import { UIDataProviderController } from './ui-data-provider.controller'
import { UIDataProviderService } from './ui-data-provider.service'

@Module({
  imports: [TypeOrmModule.forFeature([Assessment, Candidate, AssessmentMeeting, AssessmentMeetingQuestion])],
  controllers: [UIDataProviderController],
  providers: [UIDataProviderService],
  exports: [],
})
export class UIDataProviderModule {}
