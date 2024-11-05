import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AssessmentMeeting } from '../assessments/entities/assessment-meeting.entity'
import { CandidatesController } from './candidates.controller'
import { CandidatesService } from './candidates.service'
import { Candidate } from './entities/candidate.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Candidate, AssessmentMeeting])],
  controllers: [CandidatesController],
  providers: [CandidatesService],
  exports: [],
})
export class CandidatesModule {}
