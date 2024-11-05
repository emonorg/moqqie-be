import { IsDefined, IsUUID } from 'class-validator'

export class ResendAssessmentEmailDto {
  @IsUUID(4, { message: 'Assessment ID must be a valid UUID!' })
  @IsDefined({ message: 'Assessment ID is required!' })
  assessmentMeetingId!: string
}
