import { Type } from 'class-transformer'
import { IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator'

export class QuestionRuleDto {
  @IsString({ message: 'Rule is required!' })
  @MaxLength(255, { message: 'Rule can be max 255 characters!' })
  @IsNotEmpty({ message: 'Rule is required!' })
  content!: string
}

export class CreateQuestionDto {
  @IsString({ message: 'Question is required!' })
  @MaxLength(255, { message: 'Question can be max 255 characters!' })
  @IsNotEmpty({ message: 'Question is required!' })
  content!: string

  @IsOptional()
  @IsString({ message: 'Notes must be a string!' })
  notes!: string

  @IsOptional()
  @Type(() => QuestionRuleDto)
  @ValidateNested({ each: true })
  rules!: QuestionRuleDto[]

  @IsOptional()
  @IsString({ message: 'Label must be a string!' })
  labelId!: string
}
