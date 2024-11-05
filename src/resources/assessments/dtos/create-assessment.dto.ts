import { IsDateString, IsDefined, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateAssessmentDto {
  @IsString({ message: 'Title is required!' })
  @MinLength(3, { message: 'Title is too short!' })
  @MaxLength(64, { message: 'Title is too long!' })
  title!: string

  @IsString({ message: 'Description is required!' })
  @MaxLength(1000, { message: 'Description must be max 1000 characters!' })
  @IsNotEmpty({ message: 'Description is required!' })
  description!: string

  @IsString({ message: 'Goodbye message is required!' })
  @MaxLength(1000, { message: 'Goodbye message must be max 1000 characters!' })
  @IsNotEmpty({ message: 'Goodbye message is required!' })
  goodbyeMessage!: string

  @IsString()
  @IsOptional()
  notes!: string

  @IsDateString({}, { message: 'Ends at is required!' })
  @IsNotEmpty({ message: 'Ends at is required!' })
  @IsDefined({ message: 'Ends at is required!' })
  endsAt!: Date
}
