import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AssessmentMeetingQuestion } from '../assessments/entities/assessment-meeting-questions.entity'
import { QuestionLabel } from './entities/question-label.entity'
import { QuestionRule } from './entities/question-rule.entity'
import { Question } from './entities/question.entity'
import { QuestionsController } from './questions.controller'
import { QuestionsService } from './questions.service'

@Module({
  imports: [TypeOrmModule.forFeature([Question, QuestionRule, AssessmentMeetingQuestion, QuestionLabel])],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [],
})
export class QuestionsModule {}
