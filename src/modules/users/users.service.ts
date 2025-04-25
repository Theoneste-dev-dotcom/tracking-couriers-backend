import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
  ConsoleLogger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { SignupResponseDto } from './dto/signup-response.dto';
import { Company } from '../companies/entities/company.entity';
import { Role } from 'src/common/enums/role.enum';
import { SubscriptionService } from '../subscription/subscription.service';
import {
  AdminUpdateUserDto,
  DriverUpdateUserDto,
} from './dto/update-user1.dto';
import { AssignRoleDto } from './dto/assing-role.dto';
import {
  CreateAdminDto,
  CreateDriverDto,
  CreateOfficerDto,
  CreateUserDto,
  PartialOwnerDto,
} from './dto/creating.dto';
import passport, { use } from 'passport';
import { UpdateUserDto } from './dto/update-user.dto';
import { Driver } from './entities/driver.entity';
import { Client } from './entities/client.entity';
import { Officer } from './entities/officers.entity';
import { CompanyOwner } from './entities/company_owner.entity';
import { Admin } from './entities/admins.entity';
import { switchAll } from 'rxjs';
import * as fs from 'fs';
import { join } from 'path';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationEvent } from 'src/common/enums/notification-events.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private user_repo: Repository<User>,

    @InjectRepository(Driver)
    private driver_repo: Repository<Driver>,

    @InjectRepository(Client)
    private client_repo: Repository<Client>,

    @InjectRepository(Officer)
    private officer_repo: Repository<Officer>,

    @InjectRepository(Admin)
    private admin_repo: Repository<Admin>,

    @InjectRepository(CompanyOwner)
    private company_owner_repo: Repository<CompanyOwner>,

    @InjectRepository(Company)
    private company_repo: Repository<Company>,

    private subscriptionService: SubscriptionService,

    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
    currentUser: any,
    companyId?: number,
  ) {
    await this.validateUserCreation(createUserDto, currentUser);
    const { name, email, password, role, phone } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.user_repo.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
    });

    switch (createUserDto.role) {
      case Role.ADMIN:
        return this.createAdminUser(user, currentUser, companyId);
      case Role.DRIVER:
        return this.createDriverUser(
          user,
          currentUser,
          companyId,
          createUserDto.vehicleId,
        );
      case Role.OFFICER:
        return this.createOfficerUser(user, currentUser, companyId);
      default:
        return this.createNormalUser(user);
    }
  }

  private async validateUserCreation(
    createUserDto: CreateUserDto,
    currentUser?: User,
  ) {
    // Check if user exists
    const existingUser = await this.user_repo.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    if (
      createUserDto.role === Role.ADMIN &&
      (!currentUser || currentUser.role !== Role.COMPANY_OWNER)
    ) {
      throw new UnauthorizedException(
        'Only company owners can create admin users',
      );
    }

    if (
      [Role.DRIVER, Role.OFFICER].includes(createUserDto.role) &&
      !currentUser
    ) {
      throw new UnauthorizedException(
        'You must be logged in to create this user type',
      );
    }
  }

  private async createAdminUser(
    userData: User,
    currentUser: any,
    companyId,
  ): Promise<SignupResponseDto> {
    const company = await this.validateCompanyExists(companyId);
    //log("the company is ", company , " and the company id is ", companyId, " with current user ", currentUser);
    if (!company) {
      throw new ForbiddenException(
        'Only company owners can create admin users',
      );
    }

    let admin = this.admin_repo.create({
      adminInCompany: company,
    });
    admin.user = userData;

    const newUser = await this.user_repo.save(userData);
    await this.admin_repo.save(admin);

    this.eventEmitter.emit(NotificationEvent.USER_CREATED, {
      userId: newUser.id,
      role: newUser.role,
      companyId,
      createdBy: currentUser?.id || 'system',
      timestamp: new Date(),
    });
    this.eventEmitter.emit('user.created', userData.id);

    return this.buildSignupResponse('Admin created successfully', admin);
  }

  async createCompanyOwner(userData: User, companyId: number) {
    const company = await this.company_repo.findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('company not found');
    }
    let companyOwner = this.company_owner_repo.create({
      ownedCompany: company,
    });
    companyOwner.user = userData;

    return await this.company_owner_repo.save(companyOwner);
  }

  private async createDriverUser(
    userData: User,
    currentUser: User,
    companyId?: number,
    vehicleId?: string,
  ): Promise<SignupResponseDto> {
    if (!companyId) {
      throw new BadRequestException(
        'Company ID is required for driver creation',
      );
    }

    const company = await this.validateCompanyExists(companyId);
    await this.validateUserCanCreateDriver(currentUser, companyId);
    let driver = this.driver_repo.create({
      driverInCompany: company,
      vehicleId: vehicleId,
    });

    driver.user = userData;

    await this.user_repo.save(userData);
    await this.driver_repo.save(driver);

    this.eventEmitter.emit('user.created', userData.id);
    return this.buildSignupResponse('Driver created successfully', driver);
  }

  private async createOfficerUser(
    userData: User,
    currentUser: User,
    companyId?: number,
  ): Promise<SignupResponseDto> {
    if (!companyId) {
      throw new BadRequestException(
        'Company ID is required for officer creation',
      );
    }

    const company = await this.validateCompanyExists(companyId);
    await this.validateUserCanCreateOfficer(currentUser, companyId);

    let officer = this.officer_repo.create({
      officerInCompany: company,
    });
    officer.user = userData;

    await this.user_repo.save(userData);
    await this.officer_repo.save(officer);
    this.eventEmitter.emit('user.created', userData.id);

    return this.buildSignupResponse('Officer created successfully', officer);
  }

  private buildSignupResponse(message: string, user: any): SignupResponseDto {
    return new SignupResponseDto(
      message,
      user.id,
      user.name,
      user.email,
      user.role,
      user.phone,
    );
  }

  private async createNormalUser(
    userData: CreateUserDto,
  ): Promise<SignupResponseDto> {
    const newUser = await this.user_repo.save(userData);
    // Emit event after successful creation
    return this.buildSignupResponse('User created successfully', newUser);
  }

  private async validateUserCanCreateDriver(
    currentUser: User,
    companyId: number,
  ): Promise<void> {
    const validRoles = [Role.ADMIN, Role.OFFICER, Role.COMPANY_OWNER];
    if (!validRoles.includes(currentUser.role)) {
      throw new UnauthorizedException(
        'You are not authorized to create drivers',
      );
    }

    const canAddDriver =
      await this.subscriptionService.checkDriverLimit(companyId);
    if (!canAddDriver) {
      throw new ForbiddenException('Driver limit exceeded for this company');
    }
  }

  private async validateUserCanCreateOfficer(
    currentUser: User,
    companyId: number,
  ): Promise<void> {
    const validRoles = [Role.ADMIN, Role.COMPANY_OWNER];
    if (!validRoles.includes(currentUser.role)) {
      throw new UnauthorizedException(
        'You are not authorized to create officers',
      );
    }

    const canAddOfficer =
      await this.subscriptionService.checkOfficerLimit(companyId);
    if (!canAddOfficer) {
      throw new ForbiddenException('Officer limit exceeded for this company');
    }
  }

  private async validateCompanyExists(companyId: number): Promise<Company> {
    const company = await this.company_repo.findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  //find the company users based on the role admins
  async findAllByTypeAndCompany(role: Role, companyId: number) {
    const company = this.company_repo.findOne({ where: { id: companyId } });
    if (companyId) {
      switch (role) {
        case Role.DRIVER:
          return (
            await this.driver_repo.find({
              relations: ['user', 'driverInCompany'],
            })
          ).filter((user) => user.driverInCompany.id == companyId);
        case Role.OFFICER:
          return (
            await this.officer_repo.find({
              relations: ['user', 'officerInCompany'],
            })
          ).filter((user) => user.officerInCompany.id == companyId);
        case Role.ADMIN:
          return (
            await this.admin_repo.find({
              relations: ['user', 'adminInCompany'],
            })
          ).filter((user) => user.adminInCompany.id == companyId);
        case Role.CLIENT:
          return await this.admin_repo.find({
            relations: ['user', 'clientOfCompanies'],
          });
        case Role.COMPANY_OWNER:
          return (
            await this.company_owner_repo.find({
              relations: ['user', 'ownedCompany'],
            })
          ).filter((user) => user.ownedCompany.id == companyId);
        default:
          throw new BadRequestException('Invalid role provided');
      }
    }
  }

  async findAll(): Promise<User[]> {
    const users: User[] = await this.user_repo.find();
    return users;
  }

  async findOneById(id: number): Promise<User> {
    const user = await this.user_repo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found  why');
    }

    return user;
  }

  async findUser(id: number): Promise<User> {
    const user = await this.user_repo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found  why');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.user_repo.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found why');
    }
    return user;
  }

  async getAssociatedCompany(currentUserId: number, role: string) {
    // find the corresponding id with role and id
    switch (role) {
      case Role.COMPANY_OWNER:
        const owners = await this.company_owner_repo.find({
          relations: ['ownedCompany', 'user'],
        });

        const owner = owners.find((own) => own.user.id == currentUserId);
        if (!owner) {
          return 'error getting owner';
        }
        return owner.ownedCompany;
      case Role.OFFICER:
        const officers = this.officer_repo.find({
          relations: ['officerInCompany', 'user'],
        });
        const officer = (await officers).find(
          (of) => of.user.id == currentUserId,
        );
        if (!officer) {
          return 'failed getting officer';
        }
        return officer.officerInCompany;
      case Role.DRIVER:
        const drivers = await this.driver_repo.find({
          relations: ['driverInCompany', 'user'],
        });
        const driver = drivers.find((dr) => dr.user.id == currentUserId);
        if (!driver) {
          return 'failed getting driver';
        }
        return driver.driverInCompany;

      case Role.ADMIN:
        const admins = await this.admin_repo.find({
          relations: ['adminInCompany', 'user'],
        });

        const admin = admins.find((ad) => ad.user.id == currentUserId);
        if (!admin) {
          return 'failed getting admin';
        }
        return admin.adminInCompany;

      case Role.CLIENT:
        const clients = await this.client_repo.find({
          relations: ['clientOfCompanies'],
        });
        const client = clients.find((cl) => cl.user.id == currentUserId);
        if (!client) {
          return 'failed getting client';
        }
        return client.clientOfCompanies;
    }
  }

  async updateRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    try {
      const user = await this.findUser(userId);
      user.refreshToken = refreshToken;
      await this.user_repo.save(user);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update refresh token');
    }
  }

  async getProfileImage(id: number) {
    const user = await this.user_repo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found why');
    }
    return user.profilePic;
  }

  async getUserCompany(id: number) {
    const user = await this.user_repo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    switch (user.role) {
      case Role.COMPANY_OWNER:
        const owner = await this.company_owner_repo.findOne({
          where: { user: { id } },
          relations: ['ownedCompany'],
        });
        return owner?.ownedCompany;
      case Role.ADMIN:
        const admin = await this.admin_repo.findOne({
          where: { user: { id } },
          relations: ['adminInCompany'],
        });
        return admin?.adminInCompany;
      case Role.DRIVER:
        const driver = await this.driver_repo.findOne({
          where: { user: { id } },
          relations: ['driverInCompany'],
        });
        return driver?.driverInCompany;
      case Role.OFFICER:
        const officer = await this.officer_repo.findOne({
          where: { user: { id } },
          relations: ['officerInCompany'],
        });
        return officer?.officerInCompany;
    }
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUser?: any,
    file?: Express.Multer.File,
  ): Promise<User> {
    const user = await this.findOneById(id);
    if (user.role === Role.DRIVER) {
      return this.updateDriver(user, updateUserDto, file);
    }
    // Authorization checks
    this.validateUpdatePermissions(user, currentUser);

    user.about = updateUserDto.about ?? user.about;
    user.address = updateUserDto.address ?? user.address;
    user.email = updateUserDto.email ?? user.email;
    user.name = updateUserDto.name ?? user.name;
    user.phone = updateUserDto.phone ?? user.phone;
    user.role = updateUserDto.role ?? user.role;
    // Handle profile picture update
    if (file) {
      // Delete old profile picture if exists
      if (user.profilePic) {
        try {
          const oldImagePath = join('uploads', 'profilepics', user.profilePic);

          await fs.promises.unlink(oldImagePath);
        } catch (err) {
          console.error(`Failed to delete old profile image: ${err.message}`);
        }
      }
      user.profilePic = file.filename;
    }

    if (user.role in ['admin', 'company_owner', 'officer']) {
      this.eventEmitter.emit('user.updated', user.id);
    }

    // Emit update event
    return await this.user_repo.save(user);
  }

  private async updateDriver(
    user: User,
    updateDto: UpdateUserDto,
    file?: Express.Multer.File,
  ): Promise<User> {
    // Drivers can update their own info (except role)

    const driver = await this.driver_repo.findOne({ where: { id: user.id } });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    driver.vehicleId = updateDto.vehicleId ?? driver.vehicleId;
    await this.driver_repo.save(driver);

    if (user.role !== updateDto.role) {
      user.about = updateDto.about ?? user.about;
      user.address = updateDto.address ?? user.address;
      user.email = updateDto.email ?? user.email;
      user.name = updateDto.name ?? user.name;
      user.phone = updateDto.phone ?? user.phone;
      user.role = updateDto.role ?? user.role;
      user.profilePic = file?.filename ?? user.profilePic;

      this.eventEmitter.emit('user.updated', user.id);
    }
    return await this.user_repo.save(user);
  }

  // must be updated for better handling
  private getNotificationRecipients(
    companyId: number,
    roles: Role[],
  ): Promise<User[]> {
    return this.user_repo.find({
      where: {
        role: In(roles),
        ...(companyId && {
          adminInCompany: { id: companyId },
          driverInCompany: { id: companyId },
          officerInCompany: { id: companyId },
        }),
      },
    });
  }

  async getCompanyMembers(companyId: number, roles: Role[]) {
    const members = await Promise.all(
      roles.map(async (role) => {
        return this.findAllByTypeAndCompany(role, companyId);
      }),
    );

    return members.flat().map((member) => member?.user);
  }

  private validateUpdatePermissions(user: User, currentUser: User): void {
    //check for updating himself only

    // Users can update themselves
    if (currentUser && currentUser.id === user.id) return;
    // Role-specific permissions
    switch (user.role) {
      case Role.COMPANY_OWNER:
        throw new ForbiddenException('Cannot update company owners');
      case Role.ADMIN:
        if (currentUser?.role !== Role.COMPANY_OWNER) {
          throw new ForbiddenException('Only company owners can update admins');
        }
        break;
      case Role.OFFICER:
        if (![Role.ADMIN, Role.COMPANY_OWNER].includes(currentUser.role)) {
          throw new ForbiddenException('Only admins can update officers');
        }
        break;
      case Role.DRIVER:
        if (
          ![Role.ADMIN, Role.OFFICER, Role.COMPANY_OWNER].includes(
            currentUser?.role,
          )
        ) {
          throw new ForbiddenException(
            'Only owners/admins/officers can update drivers',
          );
        }
        break;
    }
  }

  async deleteUserById(userId: number, currentUser: User): Promise<string> {
    const user = await this.user_repo.findOne({
      where: { id: userId },
      relations: ['admin', 'driver', 'officer', 'companyOwner'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!currentUser) {
      throw new UnauthorizedException('You must be logged in to delete a user');
    }

    switch (user.role) {
      case Role.ADMIN:
        return this.deleteAdminUser(userId);
      case Role.DRIVER:
        return this.deleteDriverUser(userId);
      case Role.OFFICER:
        return this.deleteOfficerUser(userId);
      case Role.COMPANY_OWNER:
        return this.deleteCompanyOwner(userId);
      default:
        return this.deleteNormalUser(userId);
    }
  }

  private async deleteAdminUser(userId: number): Promise<string> {
    const admin = await this.admin_repo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!admin) throw new NotFoundException('Admin not found');

    await this.admin_repo.remove(admin);
    await this.user_repo.remove(admin.user);

    this.eventEmitter.emit('user.deleted', userId);
    return 'Admin deleted successfully';
  }

  private async deleteDriverUser(userId: number): Promise<string> {
    const driver = await this.driver_repo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!driver) throw new NotFoundException('Driver not found');

    await this.driver_repo.remove(driver);
    await this.user_repo.remove(driver.user);

    this.eventEmitter.emit('user.deleted', userId);
    return 'Driver deleted successfully';
  }

  private async deleteOfficerUser(userId: number): Promise<string> {
    const officer = await this.officer_repo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!officer) throw new NotFoundException('Officer not found');

    await this.officer_repo.remove(officer);
    await this.user_repo.remove(officer.user);

    this.eventEmitter.emit('user.deleted', userId);
    return 'Officer deleted successfully';
  }

  private async deleteCompanyOwner(userId: number): Promise<string> {
    const owner = await this.company_owner_repo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!owner) throw new NotFoundException('Company owner not found');

    await this.company_owner_repo.remove(owner);
    await this.user_repo.remove(owner.user);

    this.eventEmitter.emit('user.deleted', userId);
    return 'Company owner deleted successfully';
  }

  private async deleteNormalUser(userId: number): Promise<string> {
    const user = await this.user_repo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.user_repo.remove(user);
    this.eventEmitter.emit('user.deleted', userId);
    return 'User deleted successfully';
  }
}

//   private validateDeletionPermissions(user: User, currentUser?: User): void {
//     // System-wide admins can delete anyone
//     if (currentUser?.role === Role.SUPER_ADMIN) return;

//     // Users can delete themselves
//     if (currentUser && currentUser.id === user.id) return;

//     // Role-specific permissions
//     switch (user.role) {
//       case Role.COMPANY_OWNER:
//         throw new ForbiddenException('Cannot delete company owners');
//       case Role.ADMIN:
//         if (currentUser?.role !== Role.COMPANY_OWNER) {
//           throw new ForbiddenException('Only company owners can delete admins');
//         }
//         break;
//       case Role.OFFICER:
//         if (currentUser?.role !== Role.ADMIN) {
//           throw new ForbiddenException('Only admins can delete officers');
//         }
//         break;
//       case Role.DRIVER:
//         if (![Role.ADMIN, Role.OFFICER].includes(currentUser?.role)) {
//           throw new ForbiddenException('Only admins/officers can delete drivers');
//         }
//         break;
//     }
//   }
// }
