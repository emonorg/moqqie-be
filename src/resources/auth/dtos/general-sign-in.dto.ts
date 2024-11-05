import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

export class AdminSignInDto {
  @IsEmail({}, { message: 'Invalid email address!' })
  @IsNotEmpty({ message: 'Email address is required' })
  emailAddress!: string

  @IsString({ message: 'Password is required' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string
}
