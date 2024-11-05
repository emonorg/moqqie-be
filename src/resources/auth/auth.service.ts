import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import { Response } from 'express'
import { ApiResponse, ApiSuccessResponse, ApiUnauthorizedException } from 'src/lib/responses/api-response'

import { Performer, PerformerRole } from 'src/lib/types/performer.type'
import { Repository } from 'typeorm'
import { AdminSignInDto } from './dtos/general-sign-in.dto'

import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Admin, AdminAccountStatus } from '../admins/entities/admin.entity'
import { AssessmentMeeting } from '../assessments/entities/assessment-meeting.entity'
import { OrganizationStatus } from '../organizations/entities/organization.entity'
import { User, UserAccountStatus } from '../users/entities/user.entity'
import { CandidateSignInDto } from './dtos/candidate-sign-in.dto'
import { ImpersonateUserDto } from './dtos/impersonate-user.dto'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AssessmentMeeting)
    private readonly assessmentMeetingsRepository: Repository<AssessmentMeeting>,
    @InjectRepository(Admin)
    private readonly adminsRepository: Repository<Admin>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async candidate_signIn(dto: CandidateSignInDto, response: Response): Promise<ApiSuccessResponse> {
    const assessmentMeeting = await this.assessmentMeetingsRepository.findOne({
      where: { id: dto.assessmentMeetingId },
      relations: { candidate: true },
    })

    if (!assessmentMeeting) {
      throw new ApiUnauthorizedException('Invalid credentials!')
    }

    if (!(await bcrypt.compare(dto.password, assessmentMeeting.passwordHash))) {
      throw new ApiUnauthorizedException('Invalid credentials!')
    }

    const accessTokenPayload: Performer = {
      userId: assessmentMeeting.candidate.id,
      role: PerformerRole.Candidate,
      organizationId: 'null',
    }

    const jwtToken = await this.jwtService.signAsync(accessTokenPayload)

    response.cookie('accessToken', jwtToken, {
      sameSite: true,
      httpOnly: true,
    })

    return new ApiSuccessResponse()
  }

  async user_signIn(dto: AdminSignInDto, response: Response): Promise<ApiSuccessResponse> {
    const user = await this.userRepository.findOne({
      where: { emailAddress: dto.emailAddress },
      relations: { organization: true },
    })

    if (!user) {
      throw new ApiUnauthorizedException('Invalid credentials!')
    }

    if (user.organization == null) {
      throw new ApiUnauthorizedException('Something went wrong! (E1000)')
    }

    if (!(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new ApiUnauthorizedException('Invalid credentials!')
    }

    if (user.accountStatus !== UserAccountStatus.Active) {
      throw new ApiUnauthorizedException('Account has been suspended', 'suspended')
    }

    if (user.organization.status !== OrganizationStatus.Active) {
      throw new ApiUnauthorizedException('Organization has been deactivated or deleted!', 'organization-not-active')
    }

    const accessTokenPayload: Performer = {
      userId: user.id,
      organizationId: user.organization.id,
      role: PerformerRole.User,
    }

    const jwtToken = await this.jwtService.signAsync(accessTokenPayload)

    response.cookie('accessToken', jwtToken, {
      sameSite: true,
      httpOnly: true,
    })

    return new ApiSuccessResponse()
  }

  async admin_impersonate(dto: ImpersonateUserDto, response: Response): Promise<ApiSuccessResponse> {
    const user = await this.userRepository.findOne({
      where: { id: dto.userId },
      relations: { organization: true },
    })

    if (!user) {
      throw new ApiUnauthorizedException('User not found')
    }

    if (user.organization == null) {
      throw new ApiUnauthorizedException('Something went wrong! (E1000)')
    }

    if (user.accountStatus !== UserAccountStatus.Active) {
      throw new ApiUnauthorizedException('Account has been suspended', 'suspended')
    }

    if (user.organization.status !== OrganizationStatus.Active) {
      throw new ApiUnauthorizedException('Organization has been deactivated or deleted!', 'organization-not-active')
    }

    const accessTokenPayload: Performer = {
      userId: user.id,
      organizationId: user.organization.id,
      role: PerformerRole.User,
    }

    const jwtToken = await this.jwtService.signAsync(accessTokenPayload)
    response.cookie('accessToken', jwtToken, {
      sameSite: true,
      httpOnly: true,
    })

    return new ApiSuccessResponse()
  }

  async signOut(response: Response): Promise<ApiSuccessResponse> {
    response.clearCookie('accessToken')

    return new ApiSuccessResponse()
  }

  async admin_signIn(dto: AdminSignInDto, response: Response): Promise<ApiResponse<Admin>> {
    const admin = await this.adminsRepository.findOne({
      where: { emailAddress: dto.emailAddress },
    })

    if (!admin) {
      throw new ApiUnauthorizedException('Invalid credentials!')
    }

    const passwordMatch = await bcrypt.compare(dto.password, admin.passwordHash)

    if (!passwordMatch) {
      throw new ApiUnauthorizedException('Invalid credentials!')
    }

    if (admin.accountStatus !== AdminAccountStatus.Active) {
      throw new ApiUnauthorizedException('Account has been deactivated or deleted!!')
    }

    const accessTokenPayload: Performer = {
      userId: admin.id,
      role: PerformerRole.Admin,
      organizationId: 'all',
    }

    const jwtToken = await this.jwtService.signAsync(accessTokenPayload)

    response.cookie('accessToken', jwtToken, {
      sameSite: true,
      httpOnly: true,
    })

    return new ApiResponse(admin)
  }

  async getPerformerByAccessToken(accessToken: string): Promise<Performer> {
    try {
      const accessTokenPayload: Performer = await this.jwtService.verifyAsync(accessToken, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
      })
      return accessTokenPayload
    } catch (e) {
      throw new ApiUnauthorizedException()
    }
  }

  async me(performer: Performer): Promise<ApiResponse<User | Admin>> {
    if (performer.role === PerformerRole.User) {
      const user = await this.userRepository.findOne({
        where: { id: performer.userId },
        relations: {
          organization: { tier: true },
        },
      })

      if (!user) {
        throw new ApiUnauthorizedException('User not found')
      }

      return new ApiResponse(user)
    }

    const admin = await this.adminsRepository.findOne({
      where: { id: performer.userId },
    })

    if (!admin) {
      throw new ApiUnauthorizedException('Admin not found')
    }

    admin.displayName = 'ADMIN'
    admin.emailAddress = 'ADMIN'

    return new ApiResponse(admin)
  }

  async getUserByAccessToken(accessToken: string): Promise<Performer> {
    try {
      const accessTokenPayload: Performer = await this.jwtService.verifyAsync(accessToken, {
        secret: this.configService.getOrThrow('JWT_SECRET'),
      })
      return accessTokenPayload
    } catch (e) {
      throw new ApiUnauthorizedException()
    }
  }
}
