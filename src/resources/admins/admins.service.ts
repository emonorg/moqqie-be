import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import { Repository } from 'typeorm'
import { Admin } from './entities/admin.entity'

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminsRepository: Repository<Admin>,
  ) {}

  async registerAdmin(displayName: string, emailAddress: string, password: string): Promise<void> {
    const existingAdmin = await this.adminsRepository.findOne({
      where: { emailAddress },
    })
    if (existingAdmin) {
      Logger.error(`Admin with email address ${emailAddress} already exists`)
      return
    }

    const passwordHash = await bcrypt.hashSync(password, 10)

    await this.adminsRepository.save(this.adminsRepository.create({ displayName, emailAddress, passwordHash }))
    Logger.debug(`Admin with email address ${emailAddress} has been created`, 'AdminsService')
  }
}
