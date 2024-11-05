import { IsDefined, IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class CandidateSignInDto {
  @IsUUID('4', { message: 'Invalid assessment meeting ID!' })
  @IsDefined({ message: 'Assessment meeting ID is required' })
  @IsNotEmpty({ message: 'Assessment meeting ID is required' })
  assessmentMeetingId!: string

  @IsString({ message: 'Password is required' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string
}
