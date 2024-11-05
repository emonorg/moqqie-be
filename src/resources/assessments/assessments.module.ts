import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AmqpModule } from 'src/lib/abstractions/amqp/amqp.module'
import { OpenAIModule } from 'src/lib/abstractions/openai/openai.module'
import { S3BucketsModule } from 'src/lib/abstractions/s3/s3.module'
import { Candidate } from '../candidates/entities/candidate.entity'
import { Feedback } from '../feedbacks/entities/feedback.entity'
import { NotificationsModule } from '../notifications/notifications.module'
import { Organization } from '../organizations/entities/organization.entity'
import { Question } from '../questions/entities/question.entity'
import { Tier } from '../subscription-tiers/entities/tier.entity'
import { AssessmentsController } from './assessments.controller'
import { AssessmentsService } from './assessments.service'
import { AssessmentMeetingConversation } from './entities/assessment-meeting-conversation.entity'
import { AssessmentMeetingQuestion } from './entities/assessment-meeting-questions.entity'
import { AssessmentMeeting } from './entities/assessment-meeting.entity'
import { AssessmentQuestion } from './entities/assessment-question.entity'
import { Assessment } from './entities/assessment.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Assessment,
      Tier,
      Candidate,
      Organization,
      AssessmentMeeting,
      AssessmentMeetingQuestion,
      Question,
      AssessmentQuestion,
      AssessmentMeetingConversation,
      Feedback,
    ]),
    AmqpModule,
    OpenAIModule,
    NotificationsModule,
    S3BucketsModule,
  ],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
