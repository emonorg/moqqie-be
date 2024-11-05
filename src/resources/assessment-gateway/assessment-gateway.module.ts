import { Module } from '@nestjs/common'
import { AssessmentsModule } from 'src/resources/assessments/assessments.module'
import { AuthModule } from 'src/resources/auth/auth.module'
import { AssessmentGW } from './assessment.gateway'

@Module({
  imports: [AuthModule, AssessmentsModule],
  providers: [AssessmentGW],
})
export class AssessmentGatewayModule {}
