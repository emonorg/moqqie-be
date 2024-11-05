import { IsNotEmpty, IsUUID } from 'class-validator'

export class AssignToAssessmentDto {
  @IsUUID(4, { message: 'Invalid question id' })
  @IsNotEmpty({ message: 'Question id is required' })
  questionId!: string

  @IsUUID(4, { message: 'Invalid assessment id' })
  @IsNotEmpty({ message: 'Assessment id is required' })
  assessmentId!: string
}
