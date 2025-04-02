import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-reponse.dto';
import { SignupResponseDto } from './dto/signup-response.dto';
import { CompaniesService } from '../companies/companies.service';
import { Company } from '../companies/entities/company.entity';
import { Role } from 'src/common/enums/role.enum';
import { SubscriptionService } from '../subscription/subscription.service';
import {
  AdminUpdateUserDto,
  DriverUpdateUserDto,
} from './dto/update-user1.dto';
import { request } from 'http';
import { AssignRoleDto } from './dto/assing-role.dto';

@Injectable()
export class UserService {
  // defining the injected repositories user annd company for accessign their entities 
  // management
  constructor(
    //defining user repository in constuctor for accessign user entity
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    //defining the company repository in constru
    @InjectRepository(Company)
    private company_repo: Repository<Company>,

    // defining the subscription service in teh constructor of type SubscriptionService
    private subscriptionService: SubscriptionService,
  
  ) {}

  // validating if company exists using the company id
  async validateCompanyExists(companyId: number) {
    const company = await this.company_repo.findOne({where: {id: companyId}});
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company
  }

  // POST /users?companyId=123
  // creating the user normal user, require
  async createUser(
    createUserDto: CreateUserDto,
    currentUser: any,
    companyId?: number,
  ) {
    // Log current user information
    if (currentUser) {
      if (createUserDto.role === Role.DRIVER && currentUser) {
        return await this.createDriver(createUserDto, currentUser, companyId);
      }
      if (createUserDto.role === Role.OFFICER && currentUser) {
        return await this.createOfficer(createUserDto, currentUser, companyId);
      }
    } else if (
      (!currentUser && createUserDto.role == Role.DRIVER) ||
      createUserDto.role == Role.OFFICER
    ) {
      
      return {
        success: false,
        message:
          'Oops! You need to be logged in  as admin/officer to register  a new driver or as admin to register new Officer.',
        code: '401',
      };
    } else if (createUserDto.role !== Role.DRIVER) {
      return await this.createNormalUser(createUserDto);
    }
  }
  async createOfficer(
    createUserDto: CreateUserDto,
    currentUser: any,
    companyId?: number,
  ): Promise<SignupResponseDto> {
    const currentRole: Role = await this.curentRole(currentUser);

    // Check if the current user has permission to add a driver
    if (currentRole !== Role.ADMIN) {
      throw new UnauthorizedException('Only admins  can add officers');
    }

    // Check if the company ID is provided and if the driver limit is exceeded
    if (companyId) {
      const canAddOfficer =
        await this.subscriptionService.checkOfficerLimit(companyId);
      if (!canAddOfficer) {
        throw new ForbiddenException(
          'Officer limit exceeded for this company.',
        );
      }
    }

    // Check if the user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('User  already exists');
    }

    // Create the new driver
    const { name, phone, email, password, role } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
    });
    await this.usersRepository.save(user);

    return new SignupResponseDto(
      'Driver created successfully!',
      user.id,
      user.name,
      user.email,
      user.role,
      user.phone,
    );
  }

  private async createDriver(
    createUserDto: CreateUserDto,
    currentUser: any,
    companyId?: number,
  ): Promise<SignupResponseDto> {
    const currentRole: Role = await this.curentRole(currentUser);

    // Check if the current user has permission to add a driver
    if (currentRole !== Role.ADMIN && currentRole !== Role.OFFICER) {
      throw new UnauthorizedException(
        'Only admins and officers can add drivers',
      );
    }

    // Check if the company ID is provided and if the driver limit is exceeded
    if (companyId) {
      const canAddDriver =
        await this.subscriptionService.checkDriverLimit(companyId);
      if (!canAddDriver) {
        throw new ForbiddenException('Driver limit exceeded for this company.');
      }
    }

    // Check if the user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('User  already exists');
    }

    // Create the new driver
    const { name, phone, email, password, role } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
    });
    await this.usersRepository.save(user);


    return new SignupResponseDto(
      'Driver created successfully!',
      user.id,
      user.name,
      user.email,
      user.role,
      user.phone,
    );
  }


  // assigning the roles for users to company using dto {role, companyIds, companyId}
  // if client to user we ive company id s, if driver to user we have company id else if driver we give company id
  private async handleRoleSpecificOperations(user: User, dto: AssignRoleDto): Promise<void> {
    switch (dto.role) {
      case Role.DRIVER:
        await this.assignDriverToCompany(user, dto.companyId);
        break;
      case Role.OFFICER:
        await this.assignOfficerToCompany(user, dto.companyId);
        break;
      case Role.COMPANY_OWNER:
        await this.assignCompanyOwnership(user, dto.companyId);
        break;
      case Role.CLIENT:
        await this.assignClientToCompanies(user, dto.companyIds);
        break;
    }
  }

  async assignDriverToCompany(user: User, companyId: number): Promise<void> {
    const company = await this.validateCompanyExists(companyId);
    user.driverInCompany = company;
    company.drivers = [...(company.drivers || []), user];
    await this.company_repo.save(company);
  }

  async assignOfficerToCompany(user: User, companyId: number): Promise<void> {
    const company = await this.validateCompanyExists(companyId);
    user.officerInCompany = company;
    company.officers = [...(company.officers || []), user];
    await this.company_repo.save(company);
  }

  
  async assignCompanyOwnership(user: User, companyId: number): Promise<void> {
    const company = await this.company_repo.findOne({
      where: { id: companyId },
      relations: ['owner']
    });

    if (!company) throw new NotFoundException('Company not found');
    if (company.owner) throw new ConflictException('Company already has an owner');

    user.ownedCompany = company;
    company.owner = user;
    await this.company_repo.save(company);
  }


  async assignClientToCompanies(user: User, companyIds: number[]): Promise<void> {
    const companies = await this.company_repo.find({
      where: { id: In(companyIds) }
    });

    if (companies.length !== companyIds.length) {
      throw new NotFoundException('One or more companies not found');
    }

    user.clientOfCompanies = companies;
    await Promise.all(companies.map(async company => {
      company.clients = [...(company.clients || []), user];
      await this.company_repo.save(company);
    }));
  }


  async findAllByTypeAndCompany(role?: Role, companyId?: string): Promise<User[]> {
    const query = this.usersRepository.createQueryBuilder('user')
      .where('user.role = :role', { role });

    if (companyId) {
      switch (role) {
        case Role.DRIVER:
          query.andWhere('user.driverInCompanyId = :id', { id:companyId });
          break;
        case Role.OFFICER:
          query.andWhere('user.officerInCompanyId = :id', { id:companyId });
          break;
        case Role.CLIENT:
          query.innerJoin('user.clientOfCompanies', 'company', 'company.id = :id', { id:companyId });
          break;
      }
    }
    return await query.getMany();
  }


  private async createNormalUser(
    createUserDto: CreateUserDto,
  ): Promise<SignupResponseDto> {
    // Check if the user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('User  already exists');
    }

    // Create the new normal user
    const { name, phone, email, password, role } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
    });
    await this.usersRepository.save(user);

    return new SignupResponseDto(
      'New User Created Successfully!',
      user.id,
      user.name,
      user.email,
      user.role,
      user.phone,
    );
  }

  async findAll(): Promise<User[]> {
    const users: User[] = await this.usersRepository.find();
    return users;
  }

  async findOneById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found  why');
    }
    
    return user;
  }

  async findUser(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found  why');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found why');
    }
    return user;
  }

  async findDriversByCompany(companyId: number): Promise<User[]> {
    const users = await this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.companies', 'company')
      .where('company.id = :companyId', { companyId })
      .andWhere('user.role = :role', { role: Role.DRIVER })
      .getMany();

    return users;
  }

  async updateRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    try {
      const user = await this.findUser(userId);
      user.refreshToken = refreshToken;
      await this.usersRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update refresh token');
    }
  }

  // async update(id: number, updateUserDto: UpdateUserDto) {
  //   const user = await this.usersRepository.findOne({
  //     where: { id },
  //     relations: ['companies'],
  //   });

  //   if (!user) {
  //     throw new NotFoundException(`User with ID ${id} not found`);
  //   }

  //   try {
  //     if (updateUserDto.companies) {
  //       if (updateUserDto.companies.length === 0) {
  //         user.companies = [];
  //       } else {
  //         const existingCompany_ids = new Set(user.companies.map((c) => c.id));

  //         const companies = await this.company_repo.findBy({
  //           id: In(updateUserDto.companies),
  //         });

  //         const unique_companies = [...user.companies];

  //         companies.forEach((company) => {
  //           if (!existingCompany_ids.has(company.id)) {
  //             unique_companies.push(company);
  //           }
  //         });

  //         if (companies.length !== updateUserDto.companies.length) {
  //           throw new NotFoundException('One or more companies not found');
  //         }

  //         user.companies = unique_companies;
  //       }
  //     }

  //     const { companies, ...otherUpdates } = updateUserDto;
  //     Object.assign(user, otherUpdates);

  //     await this.usersRepository.save(user);

  //     return { message: `User with id ${id} updated successfully` };
  //   } catch (error) {
  //     console.error('Error updating user:', error);
  //     throw new InternalServerErrorException('Failed to update user');
  //   }
  // }

  async remove(id: number): Promise<void> {
    const user = await this.findUser(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    try {
      await this.usersRepository.remove(user);
    } catch (error) {
      throw new InternalServerErrorException('Failed to remove user');
    }
  }

  // async disJoinCompany(userId: number, companyId: number) {
  //   // find user with the companies
  //   const user = await this.usersRepository.findOne({
  //     where: { id: userId },
  //     relations: ['companies'],
  //   });

  //   if (!user) {
  //     throw new NotFoundException(`User with id ${userId} Not Found`);
  //   }

  //   const company = await this.company_repo.findOne({
  //     where: { id: companyId },
  //   });

  //   if (!company) {
  //     throw new NotFoundException(`Company with ID ${companyId} not found`);
  //   }

  //   // check if the user is actually associate with this company

  //   const companyIndex = user.companies.findIndex((c) => c.id == companyId);
  //   if (companyIndex === -1) {
  //     throw new BadRequestException(
  //       `You are not associate with company ID ${companyId}`,
  //     );
  //   }

  //   user.companies.splice(companyIndex, 1);
  //   //  sabe the update user
  //   this.usersRepository.save(user);

  //   return 'You are no longer a member of ' + company.name;
  // }


  async getAssociatedCompany(userId: number): Promise<Company | Company[] | null> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: [
        'driverInCompany',
        'officerInCompany',
        'clientOfCompanies',
        'ownedCompany'
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    switch (user.role) {
      case Role.DRIVER:
        return user.driverInCompany || null;
        
      case Role.OFFICER:
        return user.officerInCompany || null;
        
      case Role.CLIENT:
        return user.clientOfCompanies || [];
        
      case Role.COMPANY_OWNER:
        return user.ownedCompany || null;

      default: // ADMIN or other non-company roles
        return null;
    }
  }



  // async getUserCompanies(userId: number) {
  //   const user = await this.usersRepository.findOne({
  //     where: { id: userId },
  //     relations: ['companies'],
  //   });

  //   if (!user) {
  //     throw new NotFoundException(`User with ID ${userId} NOT FOUND`);
  //   }

  //   if (user.companies.length <= 0) {
  //     return `  Your haven't joined any company`;
  //   }

  //   return user.companies;
  // }
  // async getUserCompaniesByEmail(email:string) {
  //   const user = await this.usersRepository.findOne({
  //     where: {email} ,
  //     relations: ['companies'],
  //   });

  //   if (!user) {
  //     throw new NotFoundException(`User with ID ${email} NOT FOUND`);
  //   }

  //   if (user.companies.length <= 0) {
  //     if(user.role == "admin") {
  //       return  "Please register your company"
  //     }else if(user.role == "client") {
  //       return "Please You haven't worked with any company"
  //     }else if(user.role == "driver") {
  //       return "You aren't registered in any company"
  //     }else {
  //       return "Unknow user"
  //     }
      
  //   }

  //   return user.companies;
  // }


  async update(
    id: number,
    updateUserDto: AdminUpdateUserDto | DriverUpdateUserDto,
    requestingUser: any,
  ) {

    const userToUpdate = await this.usersRepository.findOneBy({ id });
    if (!userToUpdate) {
      throw new NotFoundException('User not found');
    }

    if (userToUpdate.role === Role.DRIVER) {
      if(!requestingUser){
        throw new Error("YOU have to first login in order to update driver of officer")
      }
      // Driver update logic
      await this.updateDriver(id, updateUserDto, requestingUser, userToUpdate);
    } else if (userToUpdate.role === Role.OFFICER) {
      console.log(requestingUser, userToUpdate)
      if(!requestingUser){
        throw new Error("YOU have to first login in order to update driver of officer")
      }
      // Officer update logic
      await this.updateOfficer(id, updateUserDto, requestingUser, userToUpdate);
    } else {
      // Normal user/client update logic
      await this.updateNormalUser(id, updateUserDto, userToUpdate);
    }

    return {
      success: true,
      message: 'User updated successfully',
      data: userToUpdate,
    };
  }

  private async updateDriver(
    id: number,
    updateUserDto: AdminUpdateUserDto | DriverUpdateUserDto,
    requestingUser: any,
    userToUpdate: any,
  ) {
    if (
      requestingUser.role === Role.ADMIN ||
      requestingUser.role === Role.OFFICER
    ) {
      // check the same company if match

      if (!this.checkSameCompany(requestingUser, updateUserDto?.companies)) {
        throw new UnauthorizedException(
          'You can only update drivers in your own company',
        );
      }
      // Admin/Officer update
      const adminUpdateDto = updateUserDto as AdminUpdateUserDto; // Type cast
      if (adminUpdateDto.role) {
        userToUpdate.role = adminUpdateDto.role;
      }
      if (adminUpdateDto.companies) {
        // Handle updating companies array
        userToUpdate.companies = await Promise.all(
          adminUpdateDto.companies.map(async (companyId) => {
            return await this.company_repo.findOneBy({ id: companyId });
          }),
        );
      }
      // Update basic info
      userToUpdate.name = adminUpdateDto.name || userToUpdate.name;
      userToUpdate.email = adminUpdateDto.email || userToUpdate.email;
      userToUpdate.phone = adminUpdateDto.phone || userToUpdate.phone;
    } else if (
      requestingUser.role === Role.DRIVER &&
      requestingUser.id === id
    ) {
      // Driver self-update
      const driverUpdateDto = updateUserDto as DriverUpdateUserDto; // Type cast
      // Update basic info
      userToUpdate.name = driverUpdateDto.name || userToUpdate.name;
      userToUpdate.email = driverUpdateDto.email || userToUpdate.email;
      userToUpdate.phone = driverUpdateDto.phone || userToUpdate.phone;
    } else {
      throw new UnauthorizedException('Unauthorized update');
    }
    await this.usersRepository.save(userToUpdate);
  }

  private async updateOfficer(
    id: number,
    updateUserDto: AdminUpdateUserDto | DriverUpdateUserDto,
    requestingUser: any,
    userToUpdate: any,
  ) {
    if (requestingUser.role === Role.ADMIN) {

      
      if (!this.checkSameCompany(requestingUser, updateUserDto?.companies)) {
        throw new UnauthorizedException(
          'You can only update officers to your own company',
        );
      }
      // Admin update
      const adminUpdateDto = updateUserDto as AdminUpdateUserDto; // Type cast
      if (adminUpdateDto.role) {
        userToUpdate.role = adminUpdateDto.role;
      }
      if (adminUpdateDto.companies) {
        // Handle updating companies array
        userToUpdate.companies = await Promise.all(
          adminUpdateDto.companies.map(async (companyId) => {
            return await this.company_repo.findOneBy({ id: companyId });
          }),
        );
      }
      // Update basic info
      userToUpdate.name = adminUpdateDto.name || userToUpdate.name;
      userToUpdate.email = adminUpdateDto.email || userToUpdate.email;
      userToUpdate.phone = adminUpdateDto.phone || userToUpdate.phone;
    } else {
      throw new UnauthorizedException('Unauthorized update');
    }
    await this.usersRepository.save(userToUpdate);
  }

  private async   updateNormalUser(
    id: number,
    updateUserDto: AdminUpdateUserDto | DriverUpdateUserDto,
    userToUpdate: any,
  ) {
    const normalUserUpdateDto = updateUserDto as AdminUpdateUserDto;
    userToUpdate.name = normalUserUpdateDto.name || userToUpdate.name;
    userToUpdate.email = normalUserUpdateDto.email || userToUpdate.email;
    userToUpdate.phone = normalUserUpdateDto.phone || userToUpdate.phone;
    userToUpdate.role = normalUserUpdateDto.role || userToUpdate.role;
    console.log("before => ",userToUpdate)
    const result = await this.usersRepository.save(userToUpdate);
    console.log("after => ",result)
    return result;
  }

  private checkSameCompany(user1: any, newCompanies): boolean {
    // Check if user1 and user2 share a company
    if (!user1.companies || !newCompanies) {
      return false;
    }
    for (const company1 of user1.companies) {
      for (const company2 of newCompanies) {
        if (company1.id === company2.id) {
          return true;
        }
      }
    }
    return false;
  }

  async curentRole(currentUser: any): Promise<Role> {
    if (!currentUser) {
      console.log("Please sir we don't have user");
    }

    return currentUser.role;
  }async removeUserFromCompany(userId: number, companyId: number): Promise<void> {
    const user = await this.usersRepository.findOne({where: { id: userId },
      relations: ['driverInCompany', 'officerInCompany', 'clientOfCompanies']
    });

    if (!user) throw new NotFoundException('User not found');

    switch (user.role) {
      case Role.DRIVER:
        await this.removeDriverFromCompany(user, companyId);
        break;
      case Role.OFFICER:
        await this.removeOfficerFromCompany(user, companyId);
        break;
      case Role.CLIENT:
        await this.removeClientFromCompany(user, companyId);
        break;
      default:
        throw new ConflictException('User type cannot be removed from company');
    }
  }

  private async removeDriverFromCompany(user: User, companyId: number): Promise<void> {
    if (user.driverInCompany?.id !== companyId) {
      throw new ConflictException('Driver is not assigned to this company');
    }

    user.driverInCompany = undefined;
    await this.usersRepository.save(user);
  }
  private async removeOfficerFromCompany(user: User, companyId: number): Promise<void> {
    if (user.officerInCompany?.id !== companyId) {
      throw new ConflictException('Driver is not assigned to this company');
    }

    user.officerInCompany = undefined;
    await this.usersRepository.save(user);
  }
  private async removeClientFromCompany(user: User, companyId: number): Promise<void> {
  //   if (user.driverForCompany?.id !== companyId) {
  //     throw new ConflictException('Driver is not assigned to this company');
  //   }

  //   user.clinetForCompany = null;
  //   await this.userRepository.save(user);
  }


  async assignRole(userId:number, dto:AssignRoleDto):Promise<User> {
  
  const user = await this.findUser(userId);

  await this.handleRoleTransition(user, dto.role, dto.companyId);
  await this.handleRoleSpecificOperations(user, dto);

  return await this.usersRepository.save(user);
 }


  private async handleRoleTransition(user: User, role: Role, companyId: number): Promise<void> {
    // Clear previous role associations
    switch (user.role) {
      case Role.DRIVER:
        user.driverInCompany = undefined;
        break;
      case Role.OFFICER:
        user.officerInCompany = undefined;
        break;
      case Role.CLIENT:
        user.clientOfCompanies = [];
        break;
      case Role.COMPANY_OWNER:
        user.ownedCompany = undefined;
        break;
    }

    // Set new role associations
    switch (role) {
      case Role.DRIVER:
        await this.assignDriverToCompany(user, companyId);
        break;
      case Role.OFFICER:
        await this.assignOfficerToCompany(user, companyId);
        break;
      case Role.CLIENT:
        await this.assignClientToCompanies(user, [companyId]);
        break;
      case Role.COMPANY_OWNER:
        await this.assignCompanyOwnership(user, companyId);
        break;
    }
  }


}



