import { Controller, Get, Header, Headers, Query, Req, Res } from '@nestjs/common'
import { Request, Response } from 'express'
import { FeedbacksService } from './feedbacks.service'

@Controller('feedbacks')
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @Get()
  async getFeedbacks(@Query('assessmentMeetingId') assessmentMeetingId: string, @Req() request: Request) {
    return this.feedbacksService.getAssessmentMeetingFeedback(request.performer, assessmentMeetingId)
  }

  @Get('recent')
  async getRecentFeedbacks(@Req() request: Request) {
    return this.feedbacksService.getRecentFeedbacks(request.performer)
  }

  @Get('all')
  async getAllFeedbacks(@Query('assessmentId') assessmentId: string, @Req() request: Request) {
    return this.feedbacksService.getAllFeedbacks(request.performer, assessmentId)
  }

  @Get('video')
  @Header('Accept-Ranges', 'bytes')
  async streamVideo(
    @Query('assessmentMeetingId') assessmentMeetingId: string,
    @Req() request: Request,
    @Res() res: Response,
    @Headers('range') range: string,
  ) {
    const content = await this.feedbacksService.streamMeetingVideo(request.performer, assessmentMeetingId, range)

    res.set({
      'Content-Type': 'video/webm',
      'Content-Disposition': `inline;"`,
    })

    res.status(206)
    res.set('Content-Range', content.contentRange)

    content.stream.pipe(res)
  }
}
