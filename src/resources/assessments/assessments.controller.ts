import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common'
import { Request } from 'express'
import { ApiResponse, ApiSuccessResponse } from 'src/lib/responses/api-response'
import { IsCandidate } from '../auth/decorators/is-candidate.decorator'
import { Candidate } from '../candidates/entities/candidate.entity'
import { AssessmentsService } from './assessments.service'
import { AssignCandidateToAssessmentDto } from './dtos/assign-candidates.dto'
import { AssignQuestionToAssessmentDto } from './dtos/assign-questions.dto'
import { CreateAssessmentDto } from './dtos/create-assessment.dto'
import { RecreateAssessmentMeetingDto } from './dtos/recreate-assessment-meeting'
import { ResendAssessmentEmailDto } from './dtos/resend-assessment-email.dto'
import { UpdateAssessmentDto } from './dtos/update-assessment.dto'
import { AssessmentMeeting } from './entities/assessment-meeting.entity'
import { AssessmentQuestion } from './entities/assessment-question.entity'
import { Assessment } from './entities/assessment.entity'

@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Post()
  async create(@Body() dto: CreateAssessmentDto, @Req() req: Request): Promise<ApiResponse<Assessment>> {
    return await this.assessmentsService.create(req.performer, dto)
  }

  @Get(':id')
  async getAssessment(@Req() req: Request): Promise<ApiResponse<Assessment>> {
    return await this.assessmentsService.getAssessment(req.performer, req.params.id)
  }

  @Get()
  async getAssessments(@Req() req: Request): Promise<ApiResponse<Assessment[]>> {
    return await this.assessmentsService.getAssessments(req.performer, req.pagination)
  }

  @Post('assign-questions')
  async assignQuestions(
    @Body() dto: AssignQuestionToAssessmentDto,
    @Req() req: Request,
  ): Promise<ApiResponse<AssessmentQuestion[]>> {
    return await this.assessmentsService.assignQuestions(req.performer, dto)
  }

  @Post('assign-candidates')
  async assignCandidates(@Body() dto: AssignCandidateToAssessmentDto, @Req() req: Request): Promise<ApiResponse<Candidate[]>> {
    return await this.assessmentsService.assignCandidates(req.performer, dto)
  }

  @Post('/:id/publish')
  async publishAssessment(@Req() req: Request, @Param('id') id: string): Promise<ApiResponse<Assessment>> {
    return await this.assessmentsService.publish(req.performer, id)
  }

  @Patch(':id')
  async update(@Body() dto: UpdateAssessmentDto, @Param('id') id: string, @Req() req: Request): Promise<ApiResponse<Assessment>> {
    return await this.assessmentsService.updateAssessment(req.performer, id, dto)
  }

  @Post('/:id/join')
  @IsCandidate()
  async join(@Param('id') id: string, @Req() req: Request): Promise<ApiResponse<AssessmentMeeting>> {
    return await this.assessmentsService.joinAssessmentMeeting(req.performer, id)
  }

  @Get('/:id/join-info')
  @IsCandidate()
  async getJoinInfo(@Param('id') id: string, @Req() req: Request): Promise<ApiResponse<AssessmentMeeting>> {
    return await this.assessmentsService.getJoinInfo(req.performer, id)
  }

  @Get('/:id/status')
  @IsCandidate()
  async getAssessmentMeetingStatus(@Param('id') id: string, @Req() req: Request): Promise<ApiResponse<AssessmentMeeting>> {
    return await this.assessmentsService.getAssessmentMeetingStatus(req.performer, id)
  }

  @Get('/:id/meetings')
  async getAssessmentMeetings(@Param('id') id: string, @Req() req: Request): Promise<ApiResponse<AssessmentMeeting[]>> {
    return await this.assessmentsService.getAssessmentMeetings(req.performer, id)
  }

  @Post('/meetings/resend-assessment-email')
  async resendAssessmentEmail(@Body() dto: ResendAssessmentEmailDto, @Req() req: Request): Promise<ApiSuccessResponse> {
    return await this.assessmentsService.resendAssessmentEmail(req.performer, dto)
  }

  @Post('recreate-meeting')
  async recreateMeeting(@Body() dto: RecreateAssessmentMeetingDto, @Req() req: Request): Promise<ApiSuccessResponse> {
    return await this.assessmentsService.recreateAssessmentMeeting(req.performer, dto)
  }

  @Get('/:id/report')
  async getAssessmentReport(@Param('id') id: string, @Req() req: Request): Promise<ApiSuccessResponse> {
    return await this.assessmentsService.getAssessmentReport(req.performer, id)
  }
}
