import { IsDefined, IsNotEmpty, IsString } from 'class-validator'

export class CreateQuestionLabelDto {
  @IsString()
  @IsNotEmpty()
  @IsDefined()
  name!: string
}
