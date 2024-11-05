import { Type } from 'class-transformer'
import { IsDefined, IsNotEmpty, IsNumber, IsString, IsUUID, Min, ValidateNested } from 'class-validator'

export class AssessmentQuestionDto {
  @IsUUID(4, { message: 'Question ID is required!' })
  @IsNotEmpty({ message: 'Question ID is required!' })
  questionId!: string

  @IsNotEmpty({ message: 'Order is required!' })
  @IsNumber({}, { message: 'Order must be a number!' })
  @IsDefined({ message: 'Order is required!' })
  @Min(1, { message: 'Order must be greater than 0!' })
  order!: number
}

export class AssignQuestionToAssessmentDto {
  @IsString({ message: 'Assessment ID is required!' })
  @IsNotEmpty({ message: 'Assessment ID is required!' })
  assessmentId!: string

  @Type(() => AssessmentQuestionDto)
  @ValidateNested({ each: true })
  questions!: AssessmentQuestionDto[]
}
