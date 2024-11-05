import { IsEmail } from 'class-validator'

export class CreateInvitationDto {
  @IsEmail({}, { message: 'Email address must be a valid email!' })
  emailAddress!: string
}
