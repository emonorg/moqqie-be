import { IsEmail, IsUUID } from 'class-validator'

export class AdminCreateInvitationDto {
  @IsUUID(4, { message: 'Organization ID must be a valid UUID!' })
  organizationId!: string

  @IsEmail({}, { message: 'Email address must be a valid email!' })
  emailAddress!: string
}
