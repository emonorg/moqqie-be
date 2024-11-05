import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminsModule } from 'src/resources/admins/admins.module'
import { ServiceConfiguration } from './entities/service-configuration.entity'
import { ServiceConfigurationService } from './service-configuration.service'

@Module({
  imports: [TypeOrmModule.forFeature([ServiceConfiguration]), AdminsModule],
  providers: [ServiceConfigurationService],
  controllers: [],
  exports: [],
})
export class ServiceConfigurationModule {}
