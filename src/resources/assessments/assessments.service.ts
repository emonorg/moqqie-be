import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { existsSync, promises, readFileSync, unlinkSync } from 'fs'
import { Socket } from 'socket.io'
import { AmqpService } from 'src/lib/abstractions/amqp/amqp.service'
import { OpenAIService } from 'src/lib/abstractions/openai/openai.service'
import { QueueBaseService, QueueName } from 'src/lib/abstractions/queue-base-service'
import { S3BucketsService } from 'src/lib/abstractions/s3/s3.service'
import { PaginationQuery } from 'src/lib/middlewares/request-pagination.middleware'
import {
  ApiNotAcceptableException,
  ApiNotFoundException,
  ApiPaginatedResponse,
  ApiResponse,
  ApiSuccessResponse,
} from 'src/lib/responses/api-response'
import { Performer } from 'src/lib/types/performer.type'
import { Between, In, Like, Not, Repository } from 'typeorm'
import { Candidate } from '../candidates/entities/candidate.entity'
import { SendAssessmentEmailMessage } from '../emails/emails.service'
import { Feedback, FeedbackStatus } from '../feedbacks/entities/feedback.entity'
import { AnalyzeAssessmentMessage } from '../feedbacks/feedbacks.service'
import { NotificationsService } from '../notifications/notifications.service'
import { Question } from '../questions/entities/question.entity'
import { Tier } from '../subscription-tiers/entities/tier.entity'
import { AssignCandidateToAssessmentDto } from './dtos/assign-candidates.dto'
import { AssignQuestionToAssessmentDto } from './dtos/assign-questions.dto'
import { CreateAssessmentDto } from './dtos/create-assessment.dto'
import { RecreateAssessmentMeetingDto } from './dtos/recreate-assessment-meeting'
import { ResendAssessmentEmailDto } from './dtos/resend-assessment-email.dto'
import { UpdateAssessmentDto } from './dtos/update-assessment.dto'
import { AssessmentMeetingConversation } from './entities/assessment-meeting-conversation.entity'
import { AssessmentMeetingQuestion, AssessmentMeetingQuestionStatus } from './entities/assessment-meeting-questions.entity'
import { AssessmentMeeting, AssessmentMeetingStatus } from './entities/assessment-meeting.entity'
import { AssessmentQuestion } from './entities/assessment-question.entity'
import { Assessment, AssessmentStatus } from './entities/assessment.entity'
import { MeetingConversationMessage, MeetingConversationMessageRole, MeetingRetrievedQuestion } from './types'

@Injectable()
export class AssessmentsService extends QueueBaseService {
  private includesQuestionCheckPrompt!: string
  private answerCandidateQuestionPrompt!: string
  private generateAnswerFeedbackPrompt!: string
  private askFollowupQuestionPrompt!: string
  private answerFulfillCheckPrompt!: string

  constructor(
    @InjectRepository(Assessment)
    private assessmentsRepository: Repository<Assessment>,
    @InjectRepository(AssessmentMeeting)
    private assessmentMeetingsRepository: Repository<AssessmentMeeting>,
    @InjectRepository(AssessmentMeetingQuestion)
    private assessmentMeetingsQuestionsRepository: Repository<AssessmentMeetingQuestion>,
    @InjectRepository(AssessmentQuestion)
    private assessmentQuestionsRepository: Repository<AssessmentQuestion>,
    @InjectRepository(Tier)
    private tiersRepository: Repository<Tier>,
    @InjectRepository(Candidate)
    private candidatesRepository: Repository<Candidate>,
    @InjectRepository(AssessmentMeetingConversation)
    private assessmentMeetingConversationsRepository: Repository<AssessmentMeetingConversation>,
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
    @InjectRepository(Feedback)
    private feedbacksRepository: Repository<Feedback>,
    amqpService: AmqpService,
    private readonly configService: ConfigService,
    private readonly openAIService: OpenAIService,
    private readonly nfService: NotificationsService,
    private readonly s3Service: S3BucketsService,
  ) {
    super(amqpService, configService.getOrThrow('NODE_ENV'))
    this.loadAnswerIncludesQuestionCheckPrompt()
    this.loadAnswerCandidateQuestionPrompt()
    this.loadGenerateAnswerFeedbackPrompt()
    this.loadAskFollowupQuestionPrompt()
    this.loadAnswerFulfillCheckPrompt()
  }

  private async loadAnswerIncludesQuestionCheckPrompt(): Promise<void> {
    this.includesQuestionCheckPrompt = await readFileSync('./src/prompts/answer-includes-question-check-prompt.txt').toString()
  }

  private async loadAnswerCandidateQuestionPrompt(): Promise<void> {
    this.answerCandidateQuestionPrompt = await readFileSync('./src/prompts/answer-candidate-question-prompt.txt').toString()
  }

  private async loadGenerateAnswerFeedbackPrompt(): Promise<void> {
    this.generateAnswerFeedbackPrompt = await readFileSync('./src/prompts/generate-answer-feedback-prompt.txt').toString()
  }

  private async loadAskFollowupQuestionPrompt(): Promise<void> {
    this.askFollowupQuestionPrompt = await readFileSync('./src/prompts/ask-followup-question-prompt.txt').toString()
  }

  private async loadAnswerFulfillCheckPrompt(): Promise<void> {
    this.answerFulfillCheckPrompt = await readFileSync('./src/prompts/answer-fulfill-check-prompt.txt').toString()
  }

  async getAssessmentReport(performer: Performer, id: string): Promise<ApiResponse<any>> {
    const assessment = await this.assessmentsRepository.findOne({
      where: {
        organization: { id: performer.organizationId },
        id,
      },
      relations: { candidates: true },
    })

    if (!assessment) {
      throw new ApiNotFoundException('Feedback not found!')
    }

    const assessmentMeetings = await this.assessmentMeetingsRepository.find({
      where: {
        assessment: { id },
      },
    })

    const feedbacks = await this.feedbacksRepository.find({
      where: {
        assessmentMeeting: { assessment: { id } },
      },
    })

    return new ApiResponse({
      candidates: assessment.candidates.length,
      pendingMeetings: assessmentMeetings.filter((meeting) => meeting.status === AssessmentMeetingStatus.Pending).length,
      averageScore: feedbacks.reduce((acc, feedback) => acc + feedback.totalScore, 0) / feedbacks.length,
      leftMeetings: assessmentMeetings.filter((meeting) => meeting.status === AssessmentMeetingStatus.Left).length,
      errors: assessmentMeetings.filter((meeting) => meeting.status === AssessmentMeetingStatus.Error).length,
      inProgress: assessmentMeetings.filter((meeting) => meeting.status === AssessmentMeetingStatus.Joined).length,
    })
  }

  async create(performer: Performer, dto: CreateAssessmentDto): Promise<ApiResponse<Assessment>> {
    // Check if the assessment title already exists
    const existingAssessment = await this.assessmentsRepository.findOne({
      where: {
        title: dto.title,
        organization: { id: performer.organizationId },
      },
    })

    if (existingAssessment) {
      throw new ApiNotAcceptableException('Assessment with same title already exists!')
    }

    const newAssessment = await this.assessmentsRepository.save(
      this.assessmentsRepository.create({
        ...dto,
        organization: { id: performer.organizationId },
        candidates: [] as Candidate[],
      }),
    )

    return new ApiResponse(newAssessment)
  }

  async assignQuestions(performer: Performer, dto: AssignQuestionToAssessmentDto): Promise<ApiResponse<AssessmentQuestion[]>> {
    // check if questions are defined
    if (!dto.questions) {
      throw new ApiNotAcceptableException('Questions are required!')
    }

    if (dto.questions.length <= 1) {
      throw new ApiNotAcceptableException('You must assign at least 2 questions!')
    }

    const assessment = await this.assessmentsRepository.findOne({
      where: {
        id: dto.assessmentId,
        organization: { id: performer.organizationId },
      },
    })

    if (!assessment) {
      throw new ApiNotFoundException('Assessment not found!')
    }

    if (assessment.status === AssessmentStatus.Published) {
      throw new ApiNotAcceptableException('Cannot assign questions to a published assessment!')
    }

    const tier = await this.tiersRepository.findOne({
      where: { organization: { id: performer.organizationId } },
    })

    if (!tier) {
      throw new ApiNotAcceptableException('Tier not found!')
    }

    if (dto.questions.length > tier.questionsPerAssessment) {
      throw new ApiNotAcceptableException(
        `You can only assign ${tier.questionsPerAssessment} questions to an assessment! Contact support to increase the limit.`,
      )
    }

    // check if questions are valid
    const questions = await this.questionsRepository.find({
      where: {
        id: In(dto.questions.map((q) => q.questionId)),
        organization: { id: performer.organizationId },
      },
    })

    if (questions.length !== dto.questions.length) {
      throw new ApiNotAcceptableException('Invalid questions provided!')
    }

    // check if order is unique
    const orderArray = dto.questions.map((q) => q.order)
    const isSequential = orderArray.every((value, index, array) => index === 0 || array[index - 1] === value - 1)

    if (!isSequential) {
      throw new ApiNotAcceptableException('The order of questions is not sequential!')
    }

    // delete existing assessment questions
    await this.assessmentQuestionsRepository.delete({
      assessment: { id: dto.assessmentId },
    })

    // create new assessment questions
    for (const q of dto.questions) {
      await this.assessmentQuestionsRepository.save(
        this.assessmentQuestionsRepository.create({
          assessment: { id: dto.assessmentId },
          question: questions.find((question) => question.id === q.questionId),
          order: q.order,
        }),
      )
    }

    const updatedQuestions = await this.assessmentQuestionsRepository.find({
      where: { assessment: { id: dto.assessmentId } },
      relations: ['question'],
      order: { order: 'ASC' },
    })

    return new ApiResponse(updatedQuestions)
  }

  async getAssessments(performer: Performer, pagination: PaginationQuery<{ title: string }>): Promise<ApiResponse<Assessment[]>> {
    const assessments = await this.assessmentsRepository.find({
      where: {
        organization: { id: performer.organizationId },
        title: Like(`%${pagination.query.title || ''}%`),
      },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      order: { [pagination.sort]: pagination.order },
    })

    const total = await this.assessmentsRepository.count({
      where: {
        organization: { id: performer.organizationId },
        title: Like(`%${pagination.query.title || ''}%`),
      },
    })

    return new ApiPaginatedResponse(assessments, {
      limit: pagination.limit,
      page: pagination.page,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    })
  }

  async assignCandidates(performer: Performer, dto: AssignCandidateToAssessmentDto): Promise<ApiResponse<Candidate[]>> {
    // check if candidates are defined
    if (!dto.candidateIds) {
      throw new ApiNotAcceptableException('Candidates are required!')
    }

    if (dto.candidateIds.length === 0) {
      throw new ApiNotAcceptableException('No candidates provided!')
    }

    const tier = await this.tiersRepository.findOne({
      where: { organization: { id: performer.organizationId } },
    })

    if (!tier) {
      throw new ApiNotAcceptableException('Tier not found!')
    }

    // Count the number of assessments created during the last month
    const assessmentMeetings = await this.assessmentMeetingsRepository.count({
      where: {
        assessment: { organization: { id: performer.organizationId } },
        createdAt: Between(tier.createdAt, new Date()),
      },
    })

    if (assessmentMeetings + dto.candidateIds.length > tier.assessmentsPerMonth) {
      throw new ApiNotAcceptableException(
        `You have ${tier.assessmentsPerMonth - assessmentMeetings} meetings left for this month!`,
      )
    }

    const assessment = await this.assessmentsRepository.findOne({
      where: {
        id: dto.assessmentId,
        organization: { id: performer.organizationId },
      },
      relations: { candidates: true },
    })

    if (!assessment) {
      throw new ApiNotFoundException('Assessment not found!')
    }

    if (assessment.status === AssessmentStatus.Published) {
      throw new ApiNotAcceptableException('Cannot assign candidates to a published assessment!')
    }

    // check if candidates are valid
    const candidates = await this.candidatesRepository.find({
      where: {
        id: In(dto.candidateIds),
        organization: { id: performer.organizationId },
      },
    })

    if (candidates.length !== dto.candidateIds.length) {
      throw new ApiNotAcceptableException('Invalid candidates provided!')
    }

    assessment.candidates = candidates

    await this.assessmentsRepository.save(assessment)

    return new ApiResponse(candidates)
  }

  async getAssessment(performer: Performer, id: string): Promise<ApiResponse<Assessment>> {
    const assessment = await this.assessmentsRepository.findOne({
      where: {
        id,
        organization: { id: performer.organizationId },
      },
      relations: { candidates: true },
    })

    if (!assessment) {
      throw new ApiNotAcceptableException('Assessment not found')
    }

    const assessmentQuestions = await this.assessmentQuestionsRepository.find({
      where: { assessment: { id } },
      relations: ['question'],
      order: { order: 'ASC' },
    })

    assessment.questions = assessmentQuestions

    return new ApiResponse(assessment)
  }

  async recreateAssessmentMeeting(performer: Performer, dto: RecreateAssessmentMeetingDto): Promise<ApiSuccessResponse> {
    const assessment = await this.assessmentsRepository.findOne({
      where: {
        id: dto.assessmentId,
        organization: { id: performer.organizationId },
      },
      relations: { organization: true, candidates: true },
    })

    if (!assessment) {
      throw new ApiNotFoundException('Assessment not found!')
    }

    if (assessment.status !== AssessmentStatus.Published) {
      throw new ApiNotAcceptableException('Assessment is not published! Cannot create the meeting.')
    }

    for (const candidateId of dto.candidateIds) {
      const candidate = await this.candidatesRepository.findOne({
        where: {
          organization: { id: performer.organizationId },
          id: candidateId,
        },
      })

      if (!candidate) {
        throw new ApiNotFoundException('Candidate(s) not found!')
      }

      const assessmentMeeting = await this.assessmentMeetingsRepository.findOne({
        where: {
          assessment: { id: dto.assessmentId },
          candidate: { id: candidateId },
        },
        relations: { conversation: true, assessment: true, candidate: true },
      })

      const password = crypto
        .randomBytes(Math.ceil((64 * 3) / 4))
        .toString('base64')
        .slice(0, 9)
        .replace(/\+/g, '0')
        .replace(/\//g, '0')

      if (!assessmentMeeting) {
        const newAssessmentMeeting = await this.assessmentMeetingsRepository.save(
          this.assessmentMeetingsRepository.create({
            assessment: { id: dto.assessmentId },
            candidate: { id: candidateId },
            status: AssessmentMeetingStatus.Pending,
            passwordHash: await bcrypt.hash(password, 10),
          }),
        )

        assessment.candidates = [...assessment.candidates, candidate]
        await this.assessmentsRepository.save(assessment)

        super.sendToQueue<SendAssessmentEmailMessage>(QueueName.SendAssessmentEmail, {
          assessmentMeetingId: newAssessmentMeeting.id,
          organizationName: assessment.organization.name,
          assessmentTitle: assessment.title,
          emailAddress: candidate.emailAddress,
          password,
          dueDate: new Date(assessment.endsAt).toLocaleString(),
        })
        continue
      }

      await this.assessmentMeetingConversationsRepository.update(
        {
          id: assessmentMeeting.conversation.id,
        },
        {
          conversation: [],
        },
      )

      await this.assessmentMeetingsRepository.update(
        {
          id: assessmentMeeting.id,
        },
        {
          status: AssessmentMeetingStatus.Pending,
          passwordHash: await bcrypt.hash(password, 10),
        },
      )

      await this.assessmentMeetingsQuestionsRepository.delete({
        assessmentMeeting: { id: assessmentMeeting.id },
      })

      super.sendToQueue<SendAssessmentEmailMessage>(QueueName.SendAssessmentEmail, {
        assessmentMeetingId: assessmentMeeting.id,
        organizationName: assessment.organization.name,
        assessmentTitle: assessment.title,
        emailAddress: candidate.emailAddress,
        password,
        dueDate: new Date(assessment.endsAt).toLocaleString(),
      })
    }

    return new ApiSuccessResponse()
  }

  async publish(performer: Performer, id: string): Promise<ApiResponse<Assessment>> {
    const assessment = await this.assessmentsRepository.findOne({
      where: {
        id,
        organization: { id: performer.organizationId },
      },
      relations: { candidates: true, organization: true },
    })

    if (!assessment) {
      throw new ApiNotAcceptableException('Assessment not found!')
    }

    if (assessment.status === AssessmentStatus.Published) {
      throw new ApiNotAcceptableException('Assessment is already published!')
    }

    const questions = await this.assessmentQuestionsRepository.find({
      where: { assessment: { id } },
    })

    if (questions.length === 0) {
      throw new ApiNotAcceptableException('Assessment has no questions!')
    }

    if (assessment.candidates.length === 0) {
      throw new ApiNotAcceptableException('Assessment has no candidates!')
    }

    assessment.status = AssessmentStatus.Published

    await this.assessmentsRepository.save(assessment)

    // send email to candidates
    for (const candidate of assessment.candidates) {
      await this.createAssessmentMeeting(assessment, candidate)
    }

    this.nfService.addNotification(performer, {
      category: 'Assessment',
      title: 'Assessment Published!',
      description: `Assessment (${assessment.title}) has been published! Candidates will receive an email with the assessment link.`,
      referenceId: assessment.id,
    })

    return new ApiResponse(assessment)
  }

  private async createAssessmentMeeting(assessment: Assessment, candidate: Candidate): Promise<void> {
    const password = crypto
      .randomBytes(Math.ceil((64 * 3) / 4))
      .toString('base64')
      .slice(0, 9)
      .replace(/\+/g, '0')
      .replace(/\//g, '0')

    const newAssessmentMeeting = await this.assessmentMeetingsRepository.save(
      this.assessmentMeetingsRepository.create({
        assessment: { id: assessment.id },
        candidate: { id: candidate.id },
        status: AssessmentMeetingStatus.Pending,
        passwordHash: await bcrypt.hash(password, 10),
      }),
    )

    super.sendToQueue<SendAssessmentEmailMessage>(QueueName.SendAssessmentEmail, {
      assessmentMeetingId: newAssessmentMeeting.id,
      organizationName: assessment.organization.name,
      assessmentTitle: assessment.title,
      emailAddress: candidate.emailAddress,
      password,
      dueDate: new Date(assessment.endsAt).toLocaleString(),
    })
  }

  async updateAssessment(performer: Performer, id: string, dto: UpdateAssessmentDto): Promise<ApiResponse<Assessment>> {
    const assessment = await this.assessmentsRepository.findOne({
      where: {
        id,
        organization: { id: performer.organizationId },
      },
    })

    if (!assessment) {
      throw new ApiNotAcceptableException('Assessment not found!')
    }

    if (assessment.status === AssessmentStatus.Published) {
      throw new ApiNotAcceptableException('Cannot update a published assessment!')
    }

    if (dto.title) {
      assessment.title = dto.title
    }

    if (dto.description) {
      assessment.description = dto.description
    }

    if (dto.goodbyeMessage) {
      assessment.goodbyeMessage = dto.goodbyeMessage
    }

    if (dto.notes) {
      assessment.notes = dto.notes
    }

    if (dto.endsAt) {
      assessment.endsAt = dto.endsAt
    }

    const updatedAssessment = await this.assessmentsRepository.save(assessment)

    return new ApiResponse(updatedAssessment)
  }

  async joinAssessmentMeeting(performer: Performer, id: string): Promise<ApiResponse<AssessmentMeeting>> {
    const assessmentMeeting = await this.assessmentMeetingsRepository.findOne({
      where: {
        id,
        candidate: { id: performer.userId },
      },
      relations: { assessment: true, candidate: true, conversation: true },
    })

    if (!assessmentMeeting) {
      throw new ApiNotAcceptableException('Assessment not found!')
    }

    if (assessmentMeeting.status === AssessmentMeetingStatus.Completed) {
      throw new ApiNotAcceptableException('Assessment is already completed!')
    }

    if (assessmentMeeting.status === AssessmentMeetingStatus.Error) {
      throw new ApiNotAcceptableException('Assessment has an error!')
    }

    assessmentMeeting.status = AssessmentMeetingStatus.Joined
    assessmentMeeting.startTime = new Date()

    // create assessment meeting questions
    const assessmentQuestion = await this.assessmentQuestionsRepository.find({
      where: {
        assessment: { id: assessmentMeeting.assessment.id },
      },
      relations: { question: { rules: true } },
      order: { order: 'DESC' },
    })

    for (const question of assessmentQuestion) {
      await this.assessmentMeetingsQuestionsRepository.save(
        this.assessmentMeetingsQuestionsRepository.create({
          assessmentMeeting: { id },
          status: AssessmentMeetingQuestionStatus.Pending,
          rules: question.question.rules.map((rule) => rule.content).join('\n'),
          question: question.question.content,
          questionReference: { id: question.question.id },
        }),
      )
    }

    const newConversation = await this.assessmentMeetingConversationsRepository.save(
      this.assessmentMeetingConversationsRepository.create({
        conversation: [],
      }),
    )

    assessmentMeeting.conversation = newConversation

    const updatedAssessmentMeeting = await this.assessmentMeetingsRepository.save(assessmentMeeting)

    this.nfService.addNotification(performer, {
      category: 'Assessment',
      title: 'Candidate joined!',
      description: `(${assessmentMeeting.candidate.fullName}) has joined the assessment (${assessmentMeeting.assessment.title}) meeting.`,
    })

    return new ApiResponse(updatedAssessmentMeeting)
  }

  async internal_getMeeting(id: string): Promise<AssessmentMeeting | null> {
    const assessmentMeeting = await this.assessmentMeetingsRepository.findOne({
      where: {
        id: id,
      },
    })

    return assessmentMeeting
  }

  async getJoinInfo(performer: Performer, id: string): Promise<ApiResponse<AssessmentMeeting>> {
    const assessmentMeeting = await this.assessmentMeetingsRepository.findOne({
      where: {
        id: id,
        candidate: { id: performer.userId },
      },
      relations: {
        assessment: { organization: true },
        candidate: true,
      },
      select: {
        id: true,
        assessment: {
          title: true,
          organization: { name: true },
          description: true,
          goodbyeMessage: true,
        },
        candidate: { fullName: true },
      },
    })

    if (!assessmentMeeting) {
      throw new ApiNotFoundException('Assessment meeting not found!')
    }

    return new ApiResponse(assessmentMeeting)
  }

  async conductAssessmentMeeting(
    performer: Performer,
    assessmentMeetingId: string,
    clientSocket: Socket,
    audioFileUUID: string,
  ): Promise<void> {
    try {
      const assessmentMeeting = await this.getAssessmentMeeting(assessmentMeetingId, performer.userId)
      const conversation = assessmentMeeting.conversation.conversation
      const currentRound = this.getCurrentRound(conversation)

      let transcriptions: string | null = null
      if (currentRound >= 2) {
        transcriptions = await this.getTranscription(audioFileUUID, clientSocket)
        if (!transcriptions) return

        this.addConversationEntry(conversation, 'user', transcriptions, false)
      }

      if (currentRound < 3) {
        await this.handleInitialRounds(currentRound, transcriptions, assessmentMeeting, conversation, clientSocket)
        return
      }

      const includesQuestion = await this.checkIfIncludesQuestion(transcriptions!)
      if (await this.handleQuestionScenarios(includesQuestion, transcriptions!, assessmentMeeting, conversation, clientSocket)) {
        return
      }

      const lastQuestionInfo = this.getLastQuestionInfo(conversation)
      const meetingQuestion = await this.getMeetingQuestion(lastQuestionInfo.id!)

      if (
        await this.handleFollowUpOrFeedback(
          meetingQuestion,
          transcriptions!,
          lastQuestionInfo,
          conversation,
          assessmentMeeting,
          clientSocket,
        )
      ) {
        return
      }

      const feedback = await this.generateFeedback(transcriptions!, lastQuestionInfo.content)
      const nextQuestion = await this.internalRetrieveQuestion(assessmentMeetingId)

      await this.sendFinalResponse(feedback, nextQuestion, conversation, assessmentMeeting, clientSocket)
    } catch (e) {
      throw e
    }
  }

  private async getAssessmentMeeting(assessmentMeetingId: string, performerUserId: string) {
    const assessmentMeeting = await this.assessmentMeetingsRepository.findOne({
      where: {
        id: assessmentMeetingId,
        candidate: { id: performerUserId },
        status: Not(In([AssessmentMeetingStatus.Completed, AssessmentMeetingStatus.Error])),
      },
      relations: { candidate: true, assessment: true, conversation: true },
    })

    if (!assessmentMeeting) {
      throw new ApiNotFoundException('Assessment meeting not found!')
    }
    return assessmentMeeting
  }

  private getCurrentRound(conversation: MeetingConversationMessage[]) {
    return conversation.length === 0 ? 1 : conversation.length + 1
  }

  private async getTranscription(audioFileUUID: string, clientSocket: Socket) {
    Logger.debug(`Transcription requested for ${audioFileUUID}`)
    const transcriptions = await this.openAIService.createTranscription(`tmp/answers/${audioFileUUID}.mp3`)
    Logger.debug(`Transcription received: ${transcriptions}`)

    if (!transcriptions) {
      await this.openAIService.textToSpeechAndStreamToClient(
        clientSocket,
        'I am sorry, I ran into an error while processing your answer. Can you please repeat it?',
      )
    }
    return transcriptions
  }

  private addConversationEntry(
    conversation: MeetingConversationMessage[],
    role: MeetingConversationMessageRole,
    content: string,
    isQuestionAsked: boolean,
    questionId?: string,
  ) {
    conversation.push({
      ...(questionId && { questionId }),
      isQuestionAsked,
      role,
      content,
    })
  }

  private async handleInitialRounds(
    currentRound: number,
    transcriptions: string | null,
    assessmentMeeting: AssessmentMeeting,
    conversation: MeetingConversationMessage[],
    clientSocket: Socket,
  ) {
    if (currentRound === 2) {
      const includesQuestion = await this.checkIfIncludesQuestion(transcriptions!)
      await this.handleSecondRound(includesQuestion, transcriptions!, assessmentMeeting, conversation, clientSocket)
    } else {
      await this.sendGreetingMessage(assessmentMeeting, conversation, clientSocket)
    }
  }

  private async checkIfIncludesQuestion(transcriptions: string) {
    return await this.openAIService.createChatCompletions([
      {
        role: 'system',
        content: this.includesQuestionCheckPrompt.replace('{{sentence}}', transcriptions),
      },
    ])
  }

  private async handleSecondRound(
    includesQuestion: string,
    transcriptions: string,
    assessmentMeeting: AssessmentMeeting,
    conversation: MeetingConversationMessage[],
    clientSocket: Socket,
  ) {
    let answer: string | null = null
    const firstQuestion = await this.internalRetrieveQuestion(assessmentMeeting.id)

    if (includesQuestion === 'TRUE') {
      const candidatesQuestionAnswer = await this.getCandidatesQuestionAnswer(transcriptions, assessmentMeeting, conversation)
      answer = `${candidatesQuestionAnswer}. Let's start with the first question: ${firstQuestion!.content}`
    } else {
      answer = `Awesome, Let's start with the first question: ${firstQuestion!.content}`
    }

    this.addConversationEntry(conversation, 'assistant', answer, true, firstQuestion!.id)
    await this.updateConversation(assessmentMeeting.conversation.id, conversation)
    await this.openAIService.textToSpeechAndStreamToClient(clientSocket, answer)
    Logger.debug(`Interviewer: ${answer}`)
  }

  private async getCandidatesQuestionAnswer(
    transcriptions: string,
    assessmentMeeting: AssessmentMeeting,
    conversation: MeetingConversationMessage[],
  ) {
    const _conversation = conversation.map((round) => `role: ${round.role}, content: ${round.content}`).join('\n')
    return await this.openAIService.createChatCompletions([
      {
        role: 'system',
        content: this.answerCandidateQuestionPrompt
          .replace('{{candidateFullName}}', assessmentMeeting.candidate.fullName)
          .replace('{{conversation}}', _conversation)
          .replace('{{question}}', transcriptions),
      },
    ])
  }

  private async sendGreetingMessage(
    assessmentMeeting: AssessmentMeeting,
    conversation: MeetingConversationMessage[],
    clientSocket: Socket,
  ) {
    const greetingMessage = `Hello ${assessmentMeeting.candidate.fullName}, welcome to the assessment meeting for ${assessmentMeeting.assessment.title}. My name is Mia, and I will be conducting this interview. I will ask you the questions assigned by the recruiter, and I kindly ask that you provide detailed answers, as this will positively impact the report I send to them. How are you today? Is everything alright?`

    this.addConversationEntry(conversation, 'assistant', greetingMessage, false)
    await this.updateConversation(assessmentMeeting.conversation.id, conversation)
    await this.openAIService.textToSpeechAndStreamToClient(clientSocket, greetingMessage)
    Logger.debug(`Interviewer: ${greetingMessage}`)
  }

  private async handleQuestionScenarios(
    includesQuestion: string,
    transcriptions: string,
    assessmentMeeting: AssessmentMeeting,
    conversation: MeetingConversationMessage[],
    clientSocket: Socket,
  ) {
    if (includesQuestion === 'TRUE') {
      const candidatesQuestionAnswer = await this.getCandidatesQuestionAnswer(transcriptions, assessmentMeeting, conversation)
      this.addConversationEntry(conversation, 'assistant', candidatesQuestionAnswer, false)
      await this.openAIService.textToSpeechAndStreamToClient(clientSocket, candidatesQuestionAnswer)
      return true
    }

    if (includesQuestion === 'NEXT') {
      const question = await this.internalRetrieveQuestion(assessmentMeeting.id)
      if (!question) {
        const answer = `I asked all of my questions. I will analyze our meeting and report my findings to the recruiting team. Thank you for your time. I wish you the best of luck! Goodbye!`
        this.addConversationEntry(conversation, 'assistant', answer, false)
        await this.updateConversation(assessmentMeeting.conversation.id, conversation)
        await this.internalEndAssessmentMeeting(assessmentMeeting.id)
        return true
      }

      const answer = `Well... Let's move on to the next question: ${question.content}`
      this.addConversationEntry(conversation, 'assistant', answer, true, question.id)
      await this.updateConversation(assessmentMeeting.conversation.id, conversation)
      await this.openAIService.textToSpeechAndStreamToClient(clientSocket, answer)
      return true
    }
    return false
  }

  private getLastQuestionInfo(conversation: MeetingConversationMessage[]): MeetingRetrievedQuestion {
    for (let i = conversation.length - 1; i >= 0; i--) {
      if (conversation[i].isQuestionAsked) {
        return {
          content: conversation[i].content,
          id: conversation[i].questionId!,
        }
      }
    }
    throw new ApiNotAcceptableException('No last question found!')
  }

  private async getMeetingQuestion(lastQuestionId: string | null) {
    const meetingQuestion = await this.assessmentMeetingsQuestionsRepository.findOne({
      where: { id: lastQuestionId! },
    })
    if (!meetingQuestion) {
      throw new ApiNotAcceptableException('Meeting question not found!')
    }
    return meetingQuestion
  }

  private async handleFollowUpOrFeedback(
    meetingQuestion: AssessmentMeetingQuestion,
    transcriptions: string,
    lastQuestionInfo: MeetingRetrievedQuestion,
    conversation: MeetingConversationMessage[],
    assessmentMeeting: AssessmentMeeting,
    clientSocket: Socket,
  ) {
    if (meetingQuestion.timesFollowupAsked < 1) {
      const doesFulFill = await this.openAIService.createChatCompletions([
        {
          role: 'system',
          content: this.answerFulfillCheckPrompt
            .replace('{{question}}', lastQuestionInfo.content)
            .replace('{{answer}}', transcriptions),
        },
      ])

      if (doesFulFill === 'FALSE') {
        const followUpQuestion = await this.openAIService.createChatCompletions([
          {
            role: 'system',
            content: this.askFollowupQuestionPrompt
              .replace('{{candidateFullName}}', assessmentMeeting.candidate.fullName)
              .replace('{{question}}', lastQuestionInfo.content)
              .replace('{{answer}}', transcriptions),
          },
        ])

        this.addConversationEntry(conversation, 'assistant', followUpQuestion, false)
        await this.updateConversation(assessmentMeeting.conversation.id, conversation)

        meetingQuestion.timesFollowupAsked += 1
        await this.assessmentMeetingsQuestionsRepository.save(meetingQuestion)

        await this.openAIService.textToSpeechAndStreamToClient(clientSocket, followUpQuestion)
        return true
      }
    }
    return false
  }

  private async generateFeedback(transcriptions: string, lastQuestion: string) {
    let feedback = await this.openAIService.createChatCompletions([
      {
        role: 'system',
        content: this.generateAnswerFeedbackPrompt.replace('{{answer}}', transcriptions).replace('{{question}}', lastQuestion),
      },
    ])
    feedback = feedback.replace('Feedback: ', '').trim()
    feedback = feedback.replace('Your feedback: ', '').trim()
    return feedback
  }

  private async sendFinalResponse(
    feedback: string,
    nextQuestion: MeetingRetrievedQuestion | null,
    conversation: MeetingConversationMessage[],
    assessmentMeeting: AssessmentMeeting,
    clientSocket: Socket,
  ) {
    let answer: string | null = null

    if (!nextQuestion) {
      answer = `${feedback}. I asked all of my questions. I will analyze our meeting and report my findings to the recruiting team. Thank you for your time. I wish you the best of luck! Goodbye!`
      this.addConversationEntry(conversation, 'assistant', answer, false)
      await this.updateConversation(assessmentMeeting.conversation.id, conversation)
      await this.internalEndAssessmentMeeting(assessmentMeeting.id)
    } else {
      answer = `${feedback}. Let's move on to the next question: ${nextQuestion.content}`
      this.addConversationEntry(conversation, 'assistant', answer, true, nextQuestion.id)
    }

    await this.updateConversation(assessmentMeeting.conversation.id, conversation)
    await this.openAIService.textToSpeechAndStreamToClient(clientSocket, answer)
  }

  private async updateConversation(conversationId: string, conversation: MeetingConversationMessage[]) {
    await this.assessmentMeetingConversationsRepository.update(
      {
        id: conversationId,
      },
      {
        conversation,
      },
    )
  }

  private async internalRetrieveQuestion(assessmentMeetingId: string): Promise<MeetingRetrievedQuestion | null> {
    const assessmentMeetingQuestions = await this.assessmentMeetingsQuestionsRepository.find({
      where: {
        assessmentMeeting: { id: assessmentMeetingId },
        status: AssessmentMeetingQuestionStatus.Pending,
      },
      order: {
        createdAt: 'DESC',
      },
      relations: { questionReference: true },
    })

    if (assessmentMeetingQuestions.length === 0) {
      return null
    }

    const AssessmentMeetingQuestionInTop = assessmentMeetingQuestions[0]

    AssessmentMeetingQuestionInTop.status = AssessmentMeetingQuestionStatus.Asked
    this.assessmentMeetingsQuestionsRepository.save(AssessmentMeetingQuestionInTop)

    this.questionsRepository.update(
      { id: AssessmentMeetingQuestionInTop.questionReference.id },
      { timesAsked: () => 'times_asked + 1' },
    )

    return {
      id: AssessmentMeetingQuestionInTop.id,
      content: AssessmentMeetingQuestionInTop.question,
    }
  }

  async uploadMeetingVideo(videoFileUUID: string, assessmentMeetingId: string): Promise<void> {
    const filePath = `tmp/recordings/${videoFileUUID}.webm`

    if (!existsSync(filePath)) {
      Logger.error(`File not found! ${filePath}`)
      return
    }

    Logger.debug(`Uploading video to S3...`)
    const assessmentMeeting = await this.assessmentMeetingsRepository.findOne({
      where: {
        id: assessmentMeetingId,
      },
    })

    if (!assessmentMeeting) {
      Logger.error(`Assessment meeting not found!`)
      return
    }

    assessmentMeeting.videoUUID = videoFileUUID
    await this.assessmentMeetingsRepository.save(assessmentMeeting)

    const fileBuffer = await promises.readFile(filePath)

    await this.s3Service.putObject(videoFileUUID, fileBuffer)

    await unlinkSync(`tmp/recordings/${videoFileUUID}.webm`)

    Logger.debug(`Video uploaded to S3!`)
  }

  private async internalEndAssessmentMeeting(assessmentMeetingId: string): Promise<void> {
    const assessmentMeeting = await this.assessmentMeetingsRepository.findOne({
      where: { id: assessmentMeetingId },
      relations: { assessment: { organization: true }, candidate: true },
    })

    const feedback = await this.feedbacksRepository.save(
      this.feedbacksRepository.create({
        assessmentMeeting: { id: assessmentMeetingId },
        status: FeedbackStatus.Preparing,
        organization: { id: assessmentMeeting?.assessment.organization.id },
      }),
    )

    await this.assessmentMeetingsRepository.update(
      { id: assessmentMeetingId },
      { status: AssessmentMeetingStatus.Completed, endTime: new Date() },
    )

    super.sendToQueue<AnalyzeAssessmentMessage>(QueueName.AnalyzeAssessment, {
      feedbackId: feedback.id,
    })

    this.nfService.addNotification(
      { organizationId: assessmentMeeting?.assessment.organization.id },
      {
        category: 'Assessment',
        title: 'Candidate finished the meeting!',
        description: `${assessmentMeeting!.candidate.fullName} (${assessmentMeeting!.candidate.emailAddress}) has completed the assessment (${assessmentMeeting!.assessment.title}) meeting. The feedback will be ready in a few minutes.`,
      },
    )
  }

  async internalLeaveAssessmentMeeting(assessmentMeetingId: string): Promise<void> {
    const assessmentMeeting = await this.assessmentMeetingsRepository.findOne({
      where: { id: assessmentMeetingId },
      relations: { assessment: { organization: true }, candidate: true },
    })

    if (
      assessmentMeeting?.status === AssessmentMeetingStatus.Error ||
      assessmentMeeting?.status === AssessmentMeetingStatus.Completed
    ) {
      return
    }

    await this.assessmentMeetingsRepository.update({ id: assessmentMeetingId }, { status: AssessmentMeetingStatus.Left })

    this.nfService.addNotification(
      { organizationId: assessmentMeeting?.assessment.organization.id },
      {
        category: 'Assessment',
        title: 'Candidate left the meeting!',
        description: `${assessmentMeeting!.candidate.fullName} (${assessmentMeeting!.candidate.emailAddress}) has left the assessment (${assessmentMeeting!.assessment.title}) meeting.`,
      },
    )
  }

  async emitQuestionsProgress(socketClient: Socket, assessmentMeetingId: string): Promise<void> {
    const totalQuestionsCount = await this.assessmentMeetingsQuestionsRepository.count({
      where: {
        assessmentMeeting: { id: assessmentMeetingId },
      },
    })

    const askedQuestionsCount = await this.assessmentMeetingsQuestionsRepository.count({
      where: {
        assessmentMeeting: { id: assessmentMeetingId },
        status: AssessmentMeetingQuestionStatus.Asked,
      },
    })

    socketClient.emit('questions-progress', {
      total: totalQuestionsCount,
      answered: askedQuestionsCount,
    })
  }

  async getAssessmentMeetingStatus(performer: Performer, id: string): Promise<ApiResponse<AssessmentMeeting>> {
    const assessmentMeeting = await this.assessmentMeetingsRepository.findOne({
      where: {
        id,
        candidate: { id: performer.userId },
      },
      select: { id: true, status: true },
    })

    if (!assessmentMeeting) {
      throw new ApiNotFoundException('Assessment meeting not found!')
    }

    return new ApiResponse(assessmentMeeting)
  }

  async getAssessmentMeetings(performer: Performer, assessmentId: string): Promise<ApiResponse<AssessmentMeeting[]>> {
    const assessment = await this.assessmentsRepository.findOne({
      where: {
        id: assessmentId,
        organization: { id: performer.organizationId },
      },
    })

    if (!assessment) {
      throw new ApiNotFoundException('Assessment not found!')
    }

    const assessmentMeetings = await this.assessmentMeetingsRepository.find({
      where: {
        assessment: { id: assessment.id },
      },
      relations: { candidate: true },
    })

    return new ApiResponse(assessmentMeetings)
  }

  async resendAssessmentEmail(performer: Performer, dto: ResendAssessmentEmailDto): Promise<ApiSuccessResponse> {
    const assessmentMeeting = await this.assessmentMeetingsRepository.findOne({
      where: {
        id: dto.assessmentMeetingId,
        assessment: { organization: { id: performer.organizationId } },
      },
      relations: { candidate: true, assessment: { organization: true } },
    })

    if (!assessmentMeeting) {
      throw new ApiNotFoundException('Assessment meeting not found!')
    }

    if (assessmentMeeting.status !== AssessmentMeetingStatus.Pending) {
      throw new ApiNotAcceptableException('Meeting has been already joined!')
    }

    const password = crypto
      .randomBytes(Math.ceil((64 * 3) / 4))
      .toString('base64')
      .slice(0, 9)
      .replace(/\+/g, '0')
      .replace(/\//g, '0')

    assessmentMeeting.passwordHash = await bcrypt.hash(password, 10)
    await this.assessmentMeetingsRepository.save(assessmentMeeting)

    this.sendToQueue<SendAssessmentEmailMessage>(QueueName.SendAssessmentEmail, {
      assessmentMeetingId: assessmentMeeting.id,
      organizationName: assessmentMeeting.assessment.organization.name,
      assessmentTitle: assessmentMeeting.assessment.title,
      emailAddress: assessmentMeeting.candidate.emailAddress,
      password: password,
      dueDate: assessmentMeeting.assessment.endsAt.toLocaleString(),
    })

    return new ApiSuccessResponse()
  }
}
