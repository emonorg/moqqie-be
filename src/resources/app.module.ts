import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
import typeorm from 'config/typeorm'
import { existsSync } from 'fs'
import * as path from 'path'
import { AmqpModule } from 'src/lib/abstractions/amqp/amqp.module'
import { S3BucketsModule } from 'src/lib/abstractions/s3/s3.module'
import { ServiceConfigurationModule } from 'src/lib/abstractions/service-configuration/service-configuration.module'
import { AuthenticationExcludedRoutes } from 'src/lib/constants'
import { RequestPaginationMiddleware } from 'src/lib/middlewares/request-pagination.middleware'
import { AssessmentGatewayModule } from 'src/resources/assessment-gateway/assessment-gateway.module'
import { AdminsModule } from './admins/admins.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AssessmentsModule } from './assessments/assessments.module'
import { AuthModule } from './auth/auth.module'
import { AuthorizationGuard } from './auth/guards/authorization.guard'
import { AuthenticationMiddleware } from './auth/middlewares/authentication.middleware'
import { CandidatesModule } from './candidates/candidates.module'
import { EmailsModule } from './emails/emails.module'
import { FeedbacksModule } from './feedbacks/feedbacks.module'
import { InvitationsModule } from './invitations/invitations.module'
import { NotificationsModule } from './notifications/notifications.module'
import { OrganizationsModule } from './organizations/organizations.module'
import { QuestionsModule } from './questions/questions.module'
import { TiersModule } from './subscription-tiers/tiers.module'
import { UIDataProviderModule } from './ui-data-provider/ui-data-provider.module'
import { UsersModule } from './users/users.module'

function getEnvFilePath(): string | undefined {
  const envFilePath = path.resolve(`config/.env.${process.env.NODE_ENV}`)
  return existsSync(envFilePath) ? envFilePath : undefined
}

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      load: [typeorm],
      isGlobal: true,
      envFilePath: getEnvFilePath(),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => configService.getOrThrow('typeorm'),
    }),
    ServiceConfigurationModule,
    AmqpModule,
    AuthModule,
    TiersModule,
    AdminsModule,
    OrganizationsModule,
    UsersModule,
    EmailsModule,
    InvitationsModule,
    QuestionsModule,
    AssessmentsModule,
    CandidatesModule,
    AssessmentGatewayModule,
    FeedbacksModule,
    UIDataProviderModule,
    NotificationsModule,
    S3BucketsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthorizationGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(AuthenticationMiddleware)
      .exclude(...AuthenticationExcludedRoutes)
      .forRoutes('*')

    consumer.apply(RequestPaginationMiddleware).forRoutes({ path: '*', method: RequestMethod.GET })
  }
}
