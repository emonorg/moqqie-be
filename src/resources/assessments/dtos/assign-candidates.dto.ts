import { IsArray, IsDefined, IsNotEmpty, IsString } from 'class-validator'

export class AssignCandidateToAssessmentDto {
  @IsString({ message: 'Assessment ID is required!' })
  @IsNotEmpty({ message: 'Assessment ID is required!' })
  assessmentId!: string

  @IsArray({ message: 'Candidates are required!' })
  @IsDefined({ message: 'Candidates are required!' })
  candidateIds!: string[]
}
