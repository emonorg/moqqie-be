import { IsDefined, IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateCandidateDto {
  @IsString()
  @IsDefined({ message: 'Full name is required!' })
  @MinLength(1, { message: 'Full name is too short!' })
  fullName!: string

  @IsEmail({}, { message: 'Invalid email address!' })
  emailAddress!: string

  @IsString()
  @IsOptional()
  notes!: string
}
