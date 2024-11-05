import { Type } from 'class-transformer'
import { IsDefined, IsEnum, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator'

export enum QuestionRuleUpdateAction {
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
}

export class UpdateQuestionRuleDto {
  @IsUUID('4', { message: 'Rule id must be a valid UUID!' })
  @IsOptional()
  id!: string

  @IsString({ message: 'Rule is required!' })
  @MaxLength(90, { message: 'Rule can be max 90 characters!' })
  @IsOptional()
  content!: string

  @IsEnum(QuestionRuleUpdateAction, {
    message: 'Action must be create, update or delete!',
  })
  @IsDefined({ message: 'Action is required!' })
  action!: QuestionRuleUpdateAction
}

export class UpdateQuestionDto {
  @IsString({ message: 'Question is required!' })
  @MaxLength(255, { message: 'Question can be max 255 characters!' })
  @IsOptional()
  content!: string

  @IsOptional()
  @IsString({ message: 'Notes must be a string!' })
  notes!: string

  @IsOptional()
  @Type(() => UpdateQuestionRuleDto)
  @ValidateNested({ each: true })
  rules!: UpdateQuestionRuleDto[]

  @IsOptional()
  @IsString({ message: 'Label must be a string!' })
  labelId!: string
}
