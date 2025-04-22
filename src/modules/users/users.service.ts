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

    // Validate role-based permissions
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
    companyId
  ): Promise<SignupResponseDto> {
    const company = await this.validateCompanyExists(companyId);
        if (!company) {
      throw new ForbiddenException(
        'Only company owners can create admin users',
      );
    }

    let admin = this.admin_repo.create({
      adminInCompany: company,
    });
    admin.user = userData;

    await this.user_repo.save(userData);
    await this.admin_repo.save(admin);

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
    const user = await this.user_repo.save(userData);
    return this.buildSignupResponse('User created successfully', user);
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
  async findAllByTypeAndCompany(role: Role, companyId: number){
    const company = this.company_repo.findOne({ where: { id: companyId } });
    if (companyId) {
      switch (role) {
        case Role.DRIVER:
          return (
            await this.driver_repo.find({
              relations: ['user', 'driverInCompany'],
            })
          ).filter((user) => (user.driverInCompany.id == companyId));
        case Role.OFFICER:
          return (
            await this.officer_repo.find({
              relations: ['user', 'officerInCompany'],
            })
          ).filter((user) => (user.officerInCompany.id == companyId));
        case Role.ADMIN:
          return (
            await this.admin_repo.find({
              relations: ['user', 'adminInCompany'],
            })
          ).filter((user) => (user.adminInCompany.id == companyId));
        case Role.CLIENT:
          return await this.admin_repo.find({
            relations: ['user', 'clientOfCompanies'],
          });
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
        console.log(owners)
        const owner = owners.find((own) => own.user.id == currentUserId);
        if (!owner) {
          return 'error getting owner';
        }
        return owner.ownedCompany;
      case Role.OFFICER:
        const officers = this.officer_repo.find({
          relations: ['officerInCompany','user'],
        });
        const officer = (await officers).find((of) => of.user.id == currentUserId);
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
  
  async getProfileImage(id:number) {
    const user = await this.user_repo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found why');
    }
    return user.profilePic;
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
        console.log(oldImagePath, file.filename);
        await fs.promises.unlink(oldImagePath);
      } catch (err) {
        console.error(`Failed to delete old profile image: ${err.message}`);
      }
    }
    user.profilePic = file.filename;
  }
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

    user.about = updateDto.about ?? user.about;
    user.address = updateDto.address ?? user.address;
    user.email = updateDto.email ?? user.email;
    user.name = updateDto.name ?? user.name;
    user.phone = updateDto.phone ?? user.phone;
    user.role = updateDto.role ?? user.role;
    user.profilePic = file?.filename ?? user.profilePic;
  

    return await this.user_repo.save(user);
  }

  //   // ========== Comprehensive Delete Methods ==========

  //   async deleteUser(id: number, currentUser?: User): Promise<void> {
  //     const user = await this.findUserWithRelations(id);

  //     // Authorization checks
  //     this.validateDeletionPermissions(user, currentUser);

  //     // Role-specific deletion logic
  //     switch (user.role) {
  //       case Role.COMPANY_OWNER:
  //         await this.deleteCompanyOwner(user);
  //         break;
  //       case Role.ADMIN:
  //         await this.deleteAdmin(user, currentUser);
  //         break;
  //       case Role.DRIVER:
  //         await this.deleteDriver(user, currentUser);
  //         break;
  //       case Role.OFFICER:
  //         await this.deleteOfficer(user, currentUser);
  //         break;
  //       case Role.CLIENT:
  //         await this.deleteClient(user);
  //         break;
  //       default:
  //         await this.deleteNormalUser(user);
  //     }
  //   }

  //   private async deleteCompanyOwner(user: User): Promise<void> {
  //     // First delete the company owned by this user
  //     const company = await this.companyRepository.findOne({
  //       where: { owner: { id: user.id } },
  //       relations: ['drivers', 'officers', 'admins', 'clients']
  //     });

  //     if (company) {
  //       // Disassociate all users from the company
  //       company.drivers = [];
  //       company.officers = [];
  //       company.clients = [];
  //       company.admins = [];
  //       await this.company_repo.save(company);

  //       // Then delete the company
  //       await this.company_repo.remove(company);
  //     }

  //     // Finally delete the owner
  //     await this.usersRepository.remove(user);
  //   }

  //   private async deleteAdmin(user: User, currentUser?: User): Promise<void> {
  //     if (!currentUser || currentUser.role !== Role.COMPANY_OWNER) {
  //       throw new ForbiddenException('Only company owners can delete admins');
  //     }

  //     // Verify the admin belongs to the owner's company
  //     if (user.adminInCompany?.id !== currentUser.ownedCompany?.id) {
  //       throw new ForbiddenException('Cannot delete admin from another company');
  //     }

  //     // Remove admin from company
  //     const company = await this.companyRepository.findOne({
  //       where: { id: user.adminInCompany.id },
  //       relations: ['admins']
  //     });

  //     if (company) {
  //       company.admins = company.admins.filter(admin => admin.id !== user.id);
  //       await this.companyRepository.save(company);
  //     }

  //     await this.usersRepository.remove(user);
  //   }

  //   private async deleteDriver(user: User, currentUser?: User): Promise<void> {
  //     // Drivers can delete themselves
  //     if (currentUser && currentUser.id === user.id) {
  //       await this.usersRepository.remove(user);
  //       return;
  //     }

  //     // Admins/officers can delete drivers in their company
  //     if (currentUser &&
  //         [Role.ADMIN, Role.OFFICER].includes(currentUser.role)) {
  //       // Verify same company
  //       const currentUserCompany = currentUser.adminInCompany || currentUser.officerInCompany;
  //       if (user.driverInCompany?.id !== currentUserCompany?.id) {
  //         throw new ForbiddenException('Cannot delete driver from another company');
  //       }

  //       // Remove driver from company
  //       const company = await this.companyRepository.findOne({
  //         where: { id: user.driverInCompany.id },
  //         relations: ['drivers']
  //       });

  //       if (company) {
  //         company.drivers = company.drivers.filter(driver => driver.id !== user.id);
  //         await this.companyRepository.save(company);
  //       }

  //       await this.usersRepository.remove(user);
  //       return;
  //     }

  //     throw new ForbiddenException('Unauthorized to delete this driver');
  //   }

  //   private async deleteOfficer(user: User, currentUser?: User): Promise<void> {
  //     // Only admins can delete officers
  //     if (!currentUser || currentUser.role !== Role.ADMIN) {
  //       throw new ForbiddenException('Only admins can delete officers');
  //     }

  //     // Verify same company
  //     if (user.officerInCompany?.id !== currentUser.adminInCompany?.id) {
  //       throw new ForbiddenException('Cannot delete officer from another company');
  //     }

  //     // Remove officer from company
  //     const company = await this.companyRepository.findOne({
  //       where: { id: user.officerInCompany.id },
  //       relations: ['officers']
  //     });

  //     if (company) {
  //       company.officers = company.officers.filter(officer => officer.id !== user.id);
  //       await this.companyRepository.save(company);
  //     }

  //     await this.usersRepository.remove(user);
  //   }

  //   private async deleteClient(user: User): Promise<void> {
  //     // Remove client from all companies
  //     const companies = await this.companyRepository.find({
  //       where: { clients: { id: user.id } },
  //       relations: ['clients']
  //     });

  //     await Promise.all(companies.map(async company => {
  //       company.clients = company.clients.filter(client => client.id !== user.id);
  //       await this.companyRepository.save(company);
  //     }));

  //     await this.usersRepository.remove(user);
  //   }

  //   private async deleteNormalUser(user: User): Promise<void> {
  //     await this.usersRepository.remove(user);
  //   }

  //   // ========== Helper Methods ==========

  //   private async findUserWithRelations(id: number) {
  //     return this.usersRepository.findOne({
  //       where: { id },
  //       relations: [
  //         'ownedCompany',
  //         'adminInCompany',
  //         'driverInCompany',
  //         'officerInCompany',
  //         'clientOfCompanies'
  //       ]
  //     });
  //   }

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
