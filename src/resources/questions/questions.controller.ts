import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common'
import { Request } from 'express'
import { CreateQuestionLabelDto } from './dtos/create-question-label.dto'
import { CreateQuestionDto } from './dtos/create-question.dto'
import { UpdateQuestionDto } from './dtos/update-question.dto'
import { QuestionsService } from './questions.service'

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  async create(@Body() dto: CreateQuestionDto, @Req() req: Request) {
    return await this.questionsService.create(req.performer, dto)
  }

  @Get('/labels')
  async getQuestionLabels(@Req() req: Request) {
    return await this.questionsService.getQuestionLabels(req.performer)
  }

  @Get('/:id')
  async getQuestion(@Req() req: Request) {
    return await this.questionsService.getQuestion(req.performer, req.params.id)
  }

  @Get()
  async getQuestions(@Req() req: Request) {
    return await this.questionsService.getQuestions(req.performer, req.pagination)
  }

  @Patch('/:id')
  async updateQuestion(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return await this.questionsService.updateQuestion(req.performer, id, dto)
  }

  @Post('/labels')
  async createQuestionLabel(@Req() req: Request, @Body() dto: CreateQuestionLabelDto) {
    return await this.questionsService.createQuestionLabel(req.performer, dto)
  }
}
