import { IsDefined, IsNumber, IsString, MaxLength, Min, MinLength } from 'class-validator'

export class CreateOrganizationDto {
  @IsString()
  @IsDefined({ message: 'Name is required!' })
  @MinLength(3, { message: 'Name has to be at least 3 characters long!' })
  @MaxLength(50, { message: 'Name cannot be longer than 50 characters!' })
  name!: string

  @IsNumber()
  @IsDefined({ message: 'Assessments per month is required!' })
  @Min(1, { message: 'Assessments per month has to be at least 1!' })
  assessmentsPerMonth!: number

  @IsNumber()
  @IsDefined({ message: 'Questions per assessment is required!' })
  @Min(1, { message: 'Questions per assessment  has to be at least 1!' })
  questionsPerAssessment!: number

  @IsNumber()
  @IsDefined({ message: 'Members per organization is required!' })
  @Min(1, { message: 'Members per organization has to be at least 1!' })
  membersPerOrganization!: number
}
