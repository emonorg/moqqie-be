import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AmqpModule } from 'src/lib/abstractions/amqp/amqp.module'
import { OpenAIModule } from 'src/lib/abstractions/openai/openai.module'
import { S3BucketsModule } from 'src/lib/abstractions/s3/s3.module'
import { AssessmentMeetingQuestion } from '../assessments/entities/assessment-meeting-questions.entity'
import { AssessmentMeeting } from '../assessments/entities/assessment-meeting.entity'
import { NotificationsModule } from '../notifications/notifications.module'
import { Feedback } from './entities/feedback.entity'
import { FeedbacksController } from './feedbacks.controller'
import { FeedbacksService } from './feedbacks.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Feedback, AssessmentMeetingQuestion, AssessmentMeeting]),
    OpenAIModule,
    AmqpModule,
    NotificationsModule,
    S3BucketsModule,
  ],
  controllers: [FeedbacksController],
  providers: [FeedbacksService],
  exports: [],
})
export class FeedbacksModule {}
