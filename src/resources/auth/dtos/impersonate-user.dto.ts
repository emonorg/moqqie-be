import { IsDefined, IsNotEmpty, IsUUID } from 'class-validator'

export class ImpersonateUserDto {
  @IsUUID()
  @IsNotEmpty()
  @IsDefined()
  userId!: string

  @IsUUID()
  @IsNotEmpty()
  @IsDefined()
  organizationId!: string
}
