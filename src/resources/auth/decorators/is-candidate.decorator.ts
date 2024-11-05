import { CustomDecorator, SetMetadata } from '@nestjs/common'

export const IsCandidate = (): CustomDecorator<string> => SetMetadata('isCandidate', true)
