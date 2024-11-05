import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class UpdateAssessmentDto {
  @IsString({ message: 'Title is required!' })
  @MinLength(3, { message: 'Title is too short!' })
  @MaxLength(64, { message: 'Title is too long!' })
  @IsOptional()
  title!: string

  @IsString({ message: 'Description is required!' })
  @MaxLength(1000, { message: 'Description must be max 1000 characters!' })
  @IsOptional()
  description!: string

  @IsString({ message: 'Goodbye message is required!' })
  @MaxLength(1000, { message: 'Goodbye message must be max 1000 characters!' })
  @IsOptional()
  goodbyeMessage!: string

  @IsString()
  @IsOptional()
  notes!: string

  @IsDateString({}, { message: 'Ends at is required!' })
  @IsOptional()
  endsAt!: Date
}
