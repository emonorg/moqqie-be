import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Cron, CronExpression } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import * as amqp from 'amqplib'
import { Channel } from 'amqplib'
import { readFileSync } from 'fs'
import { AmqpService } from 'src/lib/abstractions/amqp/amqp.service'
import { OpenAIService } from 'src/lib/abstractions/openai/openai.service'
import { QueueBaseService, QueueName } from 'src/lib/abstractions/queue-base-service'
import { ReadableStreamWithRange, S3BucketsService } from 'src/lib/abstractions/s3/s3.service'
import { ApiBadRequestException, ApiNotFoundException, ApiResponse } from 'src/lib/responses/api-response'
import { Performer } from 'src/lib/types/performer.type'
import { LessThan, Repository } from 'typeorm'
import { AssessmentMeetingConversationSchema } from '../assessments/entities/assessment-meeting-conversation.entity'
import {
  AssessmentMeetingQuestion,
  AssessmentMeetingQuestionStatus,
} from '../assessments/entities/assessment-meeting-questions.entity'
import { AssessmentMeeting, AssessmentMeetingStatus } from '../assessments/entities/assessment-meeting.entity'
import { NotificationsService } from '../notifications/notifications.service'
import { Feedback, FeedbackStatus } from './entities/feedback.entity'

export interface AnalyzeAssessmentMessage {
  feedbackId: string
}

export class FeedbacksService extends QueueBaseService {
  private assessmentAnalysisPrompt!: string

  constructor(
    amqpService: AmqpService,
    private readonly configsService: ConfigService,
    @InjectRepository(Feedback)
    private readonly feedbacksRepository: Repository<Feedback>,
    @InjectRepository(AssessmentMeetingQuestion)
    private readonly assessmentMeetingQuestionsRepository: Repository<AssessmentMeetingQuestion>,
    @InjectRepository(AssessmentMeeting)
    private readonly assessmentMeetingRepository: Repository<AssessmentMeeting>,
    private readonly openAIService: OpenAIService,
    private readonly nfService: NotificationsService,
    private readonly s3Service: S3BucketsService,
  ) {
    super(amqpService, configsService.getOrThrow('NODE_ENV'))
    super.registerQueues([
      {
        [QueueName.AnalyzeAssessment]: {
          function: this.analyzeAssessment.bind(this),
        },
      },
    ])
    this.loadAssessmentAnalysisPrompt()
  }

  async getAllFeedbacks(performer: Performer, assessmentId: string): Promise<ApiResponse<Feedback[]>> {
    if (assessmentId === undefined) {
      throw new ApiBadRequestException('Assessment id is required!')
    }

    const feedbacks = await this.feedbacksRepository.find({
      where: {
        organization: { id: performer.organizationId },
        assessmentMeeting: { assessment: { id: assessmentId } },
        status: FeedbackStatus.Ready,
      },
      relations: {
        assessmentMeeting: {
          candidate: true,
        },
      },
      select: {
        assessmentMeeting: {
          id: true,
          startTime: true,
          endTime: true,
        },
      },
      order: { totalScore: 'DESC' },
    })

    return new ApiResponse(feedbacks)
  }

  async streamMeetingVideo(
    performer: Performer,
    assessmentMeetingId: string,
    contentRange: string,
  ): Promise<ReadableStreamWithRange> {
    if (assessmentMeetingId === undefined) {
      throw new ApiBadRequestException('Assessment meeting id is required!')
    }

    const feedback = await this.feedbacksRepository.findOne({
      where: {
        organization: { id: performer.organizationId },
        assessmentMeeting: { id: assessmentMeetingId },
      },
      relations: {
        assessmentMeeting: true,
      },
    })

    if (!feedback) {
      throw new ApiNotFoundException('Feedback not found!')
    }

    if (!feedback.assessmentMeeting.videoUUID) {
      throw new ApiNotFoundException('Video not found!')
    }

    const videoStream = await this.s3Service.getObject(feedback.assessmentMeeting.videoUUID, contentRange)

    if (!videoStream) {
      throw new ApiNotFoundException('Video not found!')
    }

    return videoStream
  }

  async getAssessmentMeetingFeedback(performer: Performer, assessmentMeetingId: string): Promise<ApiResponse<Feedback>> {
    if (assessmentMeetingId === undefined) {
      throw new ApiBadRequestException('Assessment meeting id is required!')
    }

    const feedback = await this.feedbacksRepository.findOne({
      where: {
        organization: { id: performer.organizationId },
        assessmentMeeting: { id: assessmentMeetingId },
      },
      relations: {
        assessmentMeeting: {
          questions: true,
          candidate: true,
          assessment: true,
          conversation: true,
        },
      },
    })

    if (!feedback) {
      throw new ApiNotFoundException('Feedback not found!')
    }

    for (let question of feedback.assessmentMeeting.questions) {
      if (question.status !== AssessmentMeetingQuestionStatus.Analyzed) {
        throw new ApiBadRequestException('Feedback generation has failed! Please contact support for more information.')
      }
    }

    feedback.assessmentMeeting.conversation.conversation = feedback.assessmentMeeting.conversation.conversation.filter(
      (message): message is AssessmentMeetingConversationSchema => {
        if ((message.content !== '' && message.role === 'assistant') || message.role === 'user') {
          return true
        }
        return false
      },
    )

    return new ApiResponse(feedback)
  }

  async analyzeAssessment(msg: amqp.ConsumeMessage, channel: Channel): Promise<void> {
    Logger.debug('Received analyze assessment task')
    const message = JSON.parse(msg.content.toString()) as AnalyzeAssessmentMessage

    const feedback = await this.feedbacksRepository.findOne({
      where: { id: message.feedbackId },
      relations: {
        assessmentMeeting: { conversation: true, assessment: true },
      },
    })

    if (!feedback) {
      Logger.error(`Feedback finalization - Feedback not found: ${message.feedbackId}`)
      return
    }

    const storedConversation = feedback.assessmentMeeting.conversation.conversation

    if (!storedConversation) {
      Logger.error(`Feedback finalization - Conversation not found: ${feedback.assessmentMeeting.conversation.id}`)
      return
    }

    for (let i = 0; i < storedConversation.length; i++) {
      let questionId: string | null = null
      let question: string | null = null
      if (storedConversation[i].isQuestionAsked) {
        const contentOfMessage = storedConversation[i]
        questionId = contentOfMessage.questionId!
        question = contentOfMessage.content
        Logger.debug('Feedback generation: question found!', questionId)
      } else {
        continue
      }

      const conversation = [] as { role: string; message: string }[]

      conversation.push({
        role: 'interviewer',
        message: storedConversation[i].content,
      })

      for (let j = i + 1; j < storedConversation.length; j++) {
        if (storedConversation[j].isQuestionAsked) {
          Logger.debug('Feedback generation: A conversation cycle has been detected')
          break
        }
        if (storedConversation[j].role === 'assistant') {
          conversation.push({
            role: 'interviewer',
            message: storedConversation[j].content as string,
          })
        } else if (storedConversation[j].role === 'user') {
          conversation.push({
            role: 'candidate',
            message: storedConversation[j].content as string,
          })
        }
      }

      if (!questionId || !question) {
        Logger.error(`Error finalizing feedback: couldn't extract question from conversation`)
        feedback.status = FeedbackStatus.Error
        await this.feedbacksRepository.save(feedback)
        continue
      }

      const assessmentMeetingQuestion = await this.assessmentMeetingQuestionsRepository.findOne({
        where: {
          id: questionId as string,
          assessmentMeeting: { id: feedback.assessmentMeeting.id },
        },
        relations: { questionReference: { rules: true } },
      })

      if (!assessmentMeetingQuestion) {
        Logger.error(`Error finalizing feedback: couldn't find assessment question - interviewStepId: ${questionId}`)
        continue
      }

      Logger.debug('Feedback generation: analyzing conversation', questionId)

      const analyzeResponse = await this.openAIService.createChatCompletionsWithBackoff<string>({ delay: 10000, maxRetries: 2 }, [
        {
          role: 'system',
          content: this.assessmentAnalysisPrompt
            .replace('{{question}}', assessmentMeetingQuestion.questionReference.content)
            .replace('{{conversation}}', JSON.stringify(conversation))
            .replace('{{rules}}', assessmentMeetingQuestion.questionReference.rules.map((rule) => rule.content).join('-')),
        },
      ])

      if (!assessmentMeetingQuestion) {
        Logger.error(`Error finalizing feedback: couldn't find assessment meeting question - interviewStepId: ${questionId}`)
        return
      }

      if (!analyzeResponse) {
        Logger.error(`analyze response error for interview step ${questionId}`)

        assessmentMeetingQuestion.status = AssessmentMeetingQuestionStatus.Error
        await this.assessmentMeetingQuestionsRepository.save(assessmentMeetingQuestion)
        continue
      }

      const analyzeObj = JSON.parse(analyzeResponse) as {
        score: number
        answerSummary: string
        analysis: string
      }

      assessmentMeetingQuestion.score = analyzeObj.score
      assessmentMeetingQuestion.analysis = analyzeObj.analysis
      assessmentMeetingQuestion.answer = analyzeObj.answerSummary
      assessmentMeetingQuestion.status = AssessmentMeetingQuestionStatus.Analyzed
      await this.assessmentMeetingQuestionsRepository.save(assessmentMeetingQuestion)

      Logger.debug('Feedback generation: analyzed successfully!', questionId)
    }

    Logger.debug('All of the interview steps analyzed!')
    await this.finalizeFeedback(feedback.id)
    channel.ack(msg)
  }

  private async finalizeFeedback(feedbackId: string): Promise<void> {
    Logger.debug(`received feedback finalize task- feedbackId: ${feedbackId}`)

    const feedback = await this.feedbacksRepository.findOne({
      where: { id: feedbackId },
      relations: {
        assessmentMeeting: { assessment: true, candidate: true },
        organization: true,
      },
    })

    if (!feedback) {
      Logger.error(`Error finalizing feedback - feedbackId: ${feedbackId}`)
      return
    }

    const assessmentMeetingQuestions = await this.assessmentMeetingQuestionsRepository.find({
      where: { assessmentMeeting: { id: feedback.assessmentMeeting.id } },
    })

    const hadError = assessmentMeetingQuestions.some(
      (interviewStep) => interviewStep.status === AssessmentMeetingQuestionStatus.Error,
    )

    const allNotAnalyzed = assessmentMeetingQuestions.some((interviewStep) =>
      [AssessmentMeetingQuestionStatus.Answered, AssessmentMeetingQuestionStatus.Pending].includes(interviewStep.status),
    )

    if (hadError) {
      feedback.status = FeedbackStatus.Error
      await this.feedbacksRepository.save(feedback)
      Logger.error(`Error finalizing feedback: some steps has errors - feedbackId: ${feedbackId}`)
      return
    }

    if (allNotAnalyzed) {
      Logger.error(`Error finalizing feedback: not all steps are not analyzed - feedbackId: ${feedbackId}`)
      return
    }

    let sumOfScores = 0
    for (const interviewStep of assessmentMeetingQuestions) {
      sumOfScores += interviewStep.score
    }

    const totalScore = sumOfScores / assessmentMeetingQuestions.length

    feedback.status = FeedbackStatus.Ready
    feedback.totalScore = totalScore

    await this.feedbacksRepository.save(feedback)

    this.nfService.addNotification(
      { organizationId: feedback.organization.id },
      {
        category: 'Feedback',
        title: 'Feedback is ready!',
        description: `Feedback for assessment (${feedback.assessmentMeeting.assessment.title}) for candidate ${feedback.assessmentMeeting.candidate.fullName} (${feedback.assessmentMeeting.candidate.emailAddress}) is ready!`,
        referenceId: feedback.assessmentMeeting.id,
      },
    )
  }

  async getRecentFeedbacks(performer: Performer): Promise<ApiResponse<Feedback[]>> {
    const feedbacks = await this.feedbacksRepository.find({
      where: { organization: { id: performer.organizationId } },
      relations: {
        assessmentMeeting: {
          candidate: true,
          assessment: true,
        },
      },
      order: { createdAt: 'DESC' },
      take: 6,
    })

    return new ApiResponse(feedbacks)
  }

  @Cron(CronExpression.EVERY_2_HOURS)
  async handleFeedbackCleanup() {
    Logger.debug('Feedback cleanup task started')
    const twoHoursAgo = new Date()
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2)

    const feedbacks = await this.feedbacksRepository.find({
      where: {
        createdAt: LessThan(twoHoursAgo),
        status: FeedbackStatus.Preparing,
      },
      relations: { assessmentMeeting: true },
    })

    for (const feedback of feedbacks) {
      Logger.debug(`Feedback cleanup: feedbackId: ${feedback.id}`)
      await this.feedbacksRepository.delete({ id: feedback.id })
      await this.assessmentMeetingRepository.update(
        {
          id: feedback.assessmentMeeting.id,
        },
        { status: AssessmentMeetingStatus.Error },
      )
    }
    Logger.debug('Feedback cleanup task completed')
  }

  private async loadAssessmentAnalysisPrompt(): Promise<void> {
    this.assessmentAnalysisPrompt = await readFileSync('./src/prompts/assessment-analysis-prompt.txt').toString()
  }
}
