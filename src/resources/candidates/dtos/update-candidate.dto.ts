import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class UpdateCandidateDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Full name is too short!' })
  fullName!: string

  @IsEmail({}, { message: 'Invalid email address!' })
  @IsOptional()
  emailAddress!: string

  @IsString()
  @IsOptional()
  notes!: string
}
