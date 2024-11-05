import { IsDefined, IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator'

export class BookDemoDto {
  @IsString()
  @IsNotEmpty({ message: 'First name is required!' })
  @IsDefined({ message: 'First name is required!' })
  firstName!: string

  @IsString()
  @IsNotEmpty({ message: 'Last name is required!' })
  @IsDefined({ message: 'Last name is required!' })
  lastName!: string

  @IsPhoneNumber(undefined, {
    message: 'Invalid phone number (Country code is required)!',
  })
  @IsNotEmpty({ message: 'Phone number is required!' })
  @IsDefined({ message: 'Phone number is required!' })
  phoneNumber!: string

  @IsString()
  @IsNotEmpty({ message: 'Organization name is required!' })
  @IsDefined({ message: 'Organization name  is required!' })
  organizationName!: string

  @IsEmail({}, { message: 'Invalid email address!' })
  @IsDefined({ message: 'Email address is required!' })
  emailAddress!: string
}
