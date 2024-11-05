import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { AdminsService } from 'src/resources/admins/admins.service'
import { Repository } from 'typeorm'
import { ServiceConfiguration } from './entities/service-configuration.entity'

@Injectable()
export class ServiceConfigurationService {
  constructor(
    @InjectRepository(ServiceConfiguration)
    private readonly SCRepository: Repository<ServiceConfiguration>,

    private readonly adminsService: AdminsService,
    private readonly configsService: ConfigService,
  ) {
    this.setupService()
  }

  async setupService(): Promise<void> {
    const serviceConfig = await this.SCRepository.findOne({
      where: { name: 'service_setup' },
    })

    if (serviceConfig) {
      return
    }

    const adminDisplayName = this.configsService.getOrThrow<string>('ADMIN_DISPLAY_NAME')
    const adminEmailAddress = this.configsService.getOrThrow<string>('ADMIN_EMAIL_ADDRESS')
    const adminPassword = this.configsService.getOrThrow<string>('ADMIN_PASSWORD')

    await this.adminsService.registerAdmin(adminDisplayName, adminEmailAddress, adminPassword)

    // This will be used to check if the service has been setup
    await this.SCRepository.save(
      this.SCRepository.create({
        name: 'service_setup',
        value: 'true',
      }),
    )
  }
}
