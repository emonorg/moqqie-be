import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common'
import { Request } from 'express'
import { ApiResponse } from 'src/lib/responses/api-response'
import { AssessmentMeeting } from '../assessments/entities/assessment-meeting.entity'
import { CandidatesService } from './candidates.service'
import { CreateCandidateDto } from './dtos/create-candidate.dto'
import { UpdateCandidateDto } from './dtos/update-candidate.dto'
import { Candidate } from './entities/candidate.entity'

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post()
  async create(@Body() body: CreateCandidateDto, @Req() req: Request): Promise<ApiResponse<Candidate>> {
    return await this.candidatesService.create(req.performer, body)
  }

  @Get()
  async getCandidates(@Req() req: Request): Promise<ApiResponse<Candidate[]>> {
    return await this.candidatesService.getCandidates(req.performer, req.pagination)
  }

  @Get(':id')
  async getCandidate(@Req() req: Request): Promise<ApiResponse<Candidate>> {
    return await this.candidatesService.getCandidate(req.performer, req.params.id)
  }

  @Patch(':id')
  async update(@Body() body: UpdateCandidateDto, @Param('id') id: string, @Req() req: Request): Promise<ApiResponse<Candidate>> {
    return await this.candidatesService.updateCandidate(req.performer, id, body)
  }

  @Get(':id/assessment-meetings')
  async getCandidateAssessmentMeetings(@Req() req: Request, @Param('id') id: string): Promise<ApiResponse<AssessmentMeeting[]>> {
    return await this.candidatesService.getCandidateAssessmentMeetings(req.performer, id)
  }
}
