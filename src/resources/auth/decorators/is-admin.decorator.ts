import { CustomDecorator, SetMetadata } from '@nestjs/common'

export const IsAdmin = (): CustomDecorator<string> => SetMetadata('isAdmin', true)
