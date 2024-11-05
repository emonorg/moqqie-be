import { Logtail } from '@logtail/node'
import { LogtailTransport } from '@logtail/winston'
import {
  BadRequestException,
  ClassSerializerInterceptor,
  HttpException,
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common'
import { NestFactory, Reflector } from '@nestjs/core'
import * as CookieParser from 'cookie-parser'
import { WinstonModule } from 'nest-winston'
import { CorsURLs } from './lib/constants'
import { GlobalExceptionFilter } from './lib/filters/global-exception.filter'
import { AppModule } from './resources/app.module'

async function bootstrap() {
  let app: INestApplication
  if (process.env.NODE_ENV === 'prod') {
    const logtail = new Logtail('kefUehuV1nHy5JeeTmQ2t4Gr')
    app = await NestFactory.create(AppModule, {
      logger: WinstonModule.createLogger({
        transports: [new LogtailTransport(logtail)],
      }),
    })
  } else {
    app = await NestFactory.create(AppModule)
  }

  app = await registerAppGlobals(app)

  await app.listen(3000)
}

export async function registerAppGlobals(app: INestApplication): Promise<INestApplication> {
  app.enableCors({
    credentials: true,
    origin: CorsURLs,
  })

  app.use(CookieParser())

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      skipMissingProperties: false,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      exceptionFactory: (validationErrors: ValidationError[] = []): HttpException => {
        return new BadRequestException(
          validationErrors.map((error) => ({
            field: error.property,
            message: Object.values(error.constraints || {}).join(', '),
          })),
        )
      },
    }),
  )

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)))

  app.useGlobalFilters(new GlobalExceptionFilter())

  return app
}
bootstrap()
