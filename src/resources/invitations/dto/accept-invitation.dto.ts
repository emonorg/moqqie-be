import { IsNotEmpty, IsString } from 'class-validator'

export class AcceptInvitationDto {
  @IsString({ message: 'Token is required!' })
  @IsNotEmpty({ message: 'Token is required!' })
  token!: string

  @IsString({ message: 'Display name is required!' })
  @IsNotEmpty({ message: 'Display name is required!' })
  displayName!: string

  @IsString({ message: 'Password is required!' })
  @IsNotEmpty({ message: 'Password is required!' })
  password!: string
}
