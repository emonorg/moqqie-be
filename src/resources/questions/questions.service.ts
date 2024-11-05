import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { PaginationQuery } from 'src/lib/middlewares/request-pagination.middleware'
import { ApiNotFoundException, ApiPaginatedResponse, ApiResponse } from 'src/lib/responses/api-response'
import { Performer } from 'src/lib/types/performer.type'
import { Like, Repository } from 'typeorm'
import {
  AssessmentMeetingQuestion,
  AssessmentMeetingQuestionStatus,
} from '../assessments/entities/assessment-meeting-questions.entity'
import { CreateQuestionLabelDto } from './dtos/create-question-label.dto'
import { CreateQuestionDto } from './dtos/create-question.dto'
import { UpdateQuestionDto } from './dtos/update-question.dto'
import { QuestionLabel } from './entities/question-label.entity'
import { QuestionRule } from './entities/question-rule.entity'
import { Question } from './entities/question.entity'

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
    @InjectRepository(QuestionLabel)
    private questionLabelsRepository: Repository<QuestionLabel>,
    @InjectRepository(QuestionRule)
    private questionRulesRepository: Repository<QuestionRule>,
    @InjectRepository(AssessmentMeetingQuestion)
    private assessmentMeetingQuestionsRepository: Repository<AssessmentMeetingQuestion>,
  ) {}

  async createQuestionLabel(performer: Performer, dto: CreateQuestionLabelDto): Promise<ApiResponse<QuestionLabel>> {
    const existingLabel = await this.questionLabelsRepository.findOne({
      where: { name: dto.name, organization: { id: performer.organizationId } },
    })

    if (existingLabel) {
      throw new ApiNotFoundException(`Label (${dto.name}) already exists!`)
    }

    const newLabel = await this.questionLabelsRepository.save(
      this.questionLabelsRepository.create({
        name: dto.name,
        organization: { id: performer.organizationId },
      }),
    )

    return new ApiResponse(newLabel)
  }

  async getQuestionLabels(performer: Performer): Promise<ApiResponse<QuestionLabel[]>> {
    const labels = await this.questionLabelsRepository.find({
      where: { organization: { id: performer.organizationId } },
    })

    return new ApiResponse(labels)
  }

  async create(performer: Performer, dto: CreateQuestionDto): Promise<ApiResponse<Question>> {
    const newQuestion = await this.questionsRepository.save(
      this.questionsRepository.create({
        content: dto.content,
        notes: dto.notes ?? null,
        organization: { id: performer.organizationId },
      }),
    )

    if (dto.rules) {
      for (const rule of dto.rules) {
        const newRule = await this.questionRulesRepository.save(
          this.questionRulesRepository.create({
            content: rule.content,
            question: { id: newQuestion.id },
          }),
        )

        newQuestion.rules = [...(newQuestion.rules ?? []), newRule]
      }
    }

    if (dto.labelId) {
      const label = await this.questionLabelsRepository.findOne({
        where: {
          id: dto.labelId,
          organization: { id: performer.organizationId },
        },
      })

      if (!label) {
        throw new ApiNotFoundException('Label not found!')
      }

      newQuestion.label = label
    }

    const createdQuestion = await this.questionsRepository.save(newQuestion)
    return new ApiResponse(createdQuestion as Question)
  }

  async getQuestion(performer: Performer, id: string): Promise<ApiResponse<Question>> {
    const question = await this.questionsRepository.findOne({
      where: { id, organization: { id: performer.organizationId } },
      relations: { rules: true, label: true },
      order: { rules: { createdAt: 'ASC' } },
    })

    if (!question) {
      throw new ApiNotFoundException('Question not found')
    }

    const meetingQuestions = await this.assessmentMeetingQuestionsRepository.find({
      where: {
        questionReference: { id: question.id },
        status: AssessmentMeetingQuestionStatus.Analyzed,
      },
    })

    let totalScore = 0
    for (const meetingQ of meetingQuestions) {
      totalScore += meetingQ.score
    }

    const averageScore = +(totalScore / meetingQuestions.length).toFixed(2)

    return new ApiResponse({ ...question, avgScore: averageScore })
  }

  async getQuestions(
    performer: Performer,
    pagination: PaginationQuery<{ content: string; labelId: string }>,
  ): Promise<ApiResponse<Question[]>> {
    const questions = await this.questionsRepository.find({
      where: {
        organization: { id: performer.organizationId },
        content: Like(`%${pagination.query.content || ''}%`),
        ...(pagination.query.labelId !== undefined && {
          label: { id: pagination.query.labelId },
        }),
      },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      order: { [pagination.sort]: pagination.order },
      relations: { label: true },
    })

    const total = await this.questionsRepository.count({
      where: {
        organization: { id: performer.organizationId },
        content: Like(`%${pagination.query.content || ''}%`),
        ...(pagination.query.labelId !== undefined && {
          label: { id: pagination.query.labelId },
        }),
      },
    })

    return new ApiPaginatedResponse(questions, {
      limit: pagination.limit,
      page: pagination.page,
      total,
      totalPages: Math.ceil(total / pagination.limit),
    })
  }

  async updateQuestion(performer: Performer, id: string, dto: UpdateQuestionDto) {
    const question = await this.questionsRepository.findOne({
      where: { id, organization: { id: performer.organizationId } },
      relations: { rules: true },
    })

    if (!question) {
      throw new ApiNotFoundException('Question not found!')
    }

    if (dto.content) {
      question.content = dto.content
    }

    if (dto.notes !== undefined || dto.notes === null) {
      question.notes = dto.notes
    }

    if (dto.rules) {
      for (const rule of dto.rules) {
        if (rule.action === 'create') {
          const newRule = await this.questionRulesRepository.save(
            this.questionRulesRepository.create({
              content: rule.content,
              question: { id: question.id },
            }),
          )

          question.rules = [...(question.rules ?? []), newRule]
        } else if (rule.action === 'update') {
          const existingRule = question.rules?.find((r) => r.id === rule.id)

          if (!existingRule) {
            throw new ApiNotFoundException('Rule not found!')
          }

          existingRule.content = rule.content
          await this.questionRulesRepository.save(existingRule)
        } else if (rule.action === 'delete') {
          const existingRule = question.rules?.find((r) => r.id === rule.id)

          if (!existingRule) {
            throw new ApiNotFoundException('Rule not found!')
          }

          await this.questionRulesRepository.delete({ id: rule.id })
          question.rules = question.rules?.filter((r) => r.id !== rule.id)
        }
      }
    }

    if (dto.labelId) {
      const label = await this.questionLabelsRepository.findOne({
        where: {
          id: dto.labelId,
          organization: { id: performer.organizationId },
        },
      })

      if (!label) {
        throw new ApiNotFoundException('Label not found!')
      }

      question.label = label
    }

    if (dto.labelId === null) {
      question.label = null as any
    }

    const updatedQuestion = await this.questionsRepository.save(question)
    return new ApiResponse(updatedQuestion)
  }
}
