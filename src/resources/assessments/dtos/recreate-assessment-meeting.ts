import { IsArray, IsDefined, IsUUID } from 'class-validator'

export class RecreateAssessmentMeetingDto {
  @IsUUID(4, { message: 'Assessment ID must be a valid UUID v4!' })
  @IsDefined({ message: 'Assessment ID is required!' })
  assessmentId!: string

  @IsArray({ message: 'Candidate Ids must be a valid UUID v4!' })
  @IsDefined({ message: 'Candidate Ids are required!' })
  candidateIds!: string[]
}
