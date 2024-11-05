import { UnauthorizedException } from '@nestjs/common'
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import * as fs from 'fs'
import { Server, Socket } from 'socket.io'
import { CorsURLs } from 'src/lib/constants'
import { PerformerRole } from 'src/lib/types/performer.type'
import { AssessmentsService } from 'src/resources/assessments/assessments.service'
import { AuthService } from 'src/resources/auth/auth.service'
import { v4 as uuidV4 } from 'uuid'

@WebSocketGateway({
  cors: {
    origin: CorsURLs,
    credentials: true,
  },
})
export class AssessmentGW implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server

  private audioBuffers = new Map<string, Buffer[]>()
  private videoBuffers = new Map<string, Buffer[]>()

  constructor(
    private readonly authService: AuthService,
    private readonly assessmentsService: AssessmentsService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const cookies = client.request.headers.cookie?.split('; ')

      const accessToken = cookies?.find((cookie: string) => cookie.startsWith('accessToken'))?.split('=')[1]

      if (!accessToken) {
        throw new UnauthorizedException()
      }

      const accessTokenPayload = await this.authService.getUserByAccessToken(accessToken)

      if (!accessTokenPayload.userId) {
        throw new UnauthorizedException()
      }

      if (accessTokenPayload.role !== PerformerRole.Candidate) {
        throw new UnauthorizedException()
      }

      client.emit('interview-log', {
        log: 'You joined the meeting successfully!',
      })

      client.data.user = accessTokenPayload
    } catch (error) {
      client.disconnect()
    }
  }

  handleDisconnect(): void {}

  @SubscribeMessage('join-interview')
  handleJoinInterview(client: Socket, data: { interviewId: string }): void {
    this.audioBuffers.set(data.interviewId, [])
    this.videoBuffers.set(data.interviewId, [])
  }

  @SubscribeMessage('candidate-response')
  handleAudioChunk(client: Socket, data: { chunk: Buffer; interviewId: string }): void {
    const audioChunks = this.audioBuffers.get(data.interviewId)
    if (audioChunks) {
      audioChunks.push(data.chunk)
    }
  }

  @SubscribeMessage('video-chunk')
  handleVideoChunks(client: Socket, data: { chunk: Buffer; interviewId: string }): void {
    const videoChunks = this.videoBuffers.get(data.interviewId)
    if (videoChunks) {
      videoChunks.push(data.chunk)
    }
  }

  @SubscribeMessage('end-recording')
  async handleEndRecording(client: Socket, data: { interviewId: string }): Promise<void> {
    const videoChunks = this.videoBuffers.get(data.interviewId)
    if (videoChunks) {
      const videoBuffer = Buffer.concat(videoChunks)
      const videoFileId = uuidV4()
      fs.writeFileSync(`tmp/recordings/${videoFileId}.webm`, videoBuffer)
      await this.assessmentsService.uploadMeetingVideo(videoFileId, data.interviewId)

      this.videoBuffers.set(data.interviewId, [])
    }
  }

  @SubscribeMessage('leave')
  async left(client: Socket, data: { meetingId: string }): Promise<void> {
    this.audioBuffers.set(data.meetingId, [])
    this.videoBuffers.set(data.meetingId, [])
    await this.assessmentsService.internalLeaveAssessmentMeeting(data.meetingId)
  }

  @SubscribeMessage('submit-answer')
  async handleSubmitAnswer(client: Socket, data: { interviewId: string }): Promise<void> {
    this.assessmentsService.emitQuestionsProgress(client, data.interviewId)

    client.emit('interview-status', {
      loading: true,
    })

    const audioChunks = this.audioBuffers.get(data.interviewId)
    if (!audioChunks) {
      return
    }

    const audioBuffer = Buffer.concat(audioChunks)
    const audioFileId = uuidV4()
    fs.writeFileSync(`tmp/answers/${audioFileId}.mp3`, audioBuffer)
    this.audioBuffers.set(data.interviewId, [])

    const meeting = await this.assessmentsService.internal_getMeeting(data.interviewId)
    if (!meeting || meeting.status === 'error' || meeting.status === 'completed') {
      client.emit('interview-error', {
        error: 'This meeting is already completed or does not exist!',
      })
      return
    }

    await this.assessmentsService.conductAssessmentMeeting(client.data.user, data.interviewId, client, audioFileId)

    client.emit('interview-status', {
      log: '',
      loading: false,
    })

    this.assessmentsService.emitQuestionsProgress(client, data.interviewId)

    fs.unlinkSync(`tmp/answers/${audioFileId}.mp3`)
  }
}
