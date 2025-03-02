import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SignupResponseDto } from './dto/signup-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { CompaniesService } from '../companies/companies.service';
import { Company } from '../companies/entities/company.entity';
import { Role } from 'src/common/enums/role.enum';
import { subscriptionLogsToBeFn } from 'rxjs/internal/testing/TestScheduler';
import { SubscriptionService } from '../subscription/subscription.service';
import {
  AdminUpdateUserDto,
  DriverUpdateUserDto,
} from './dto/update-user1.dto';
import { request } from 'http';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Company)
    private company_repo: Repository<Company>,

    private subscriptionService: SubscriptionService,
  ) {}

  // POST /users?companyId=123
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
      console.log("oops !! we don't have any user");
      return {
        success: false,
        message:
          'Oops! You need to be logged in to add a new driver or Officer. Someone with manager or admin access needs to be logged in first.',
        code: '401',
      };
    } else if (createUserDto.role != Role.DRIVER) {
      console.log(
        "We don't have user and we can create any other user ",
        createUserDto,
      );
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

  async findAll(): Promise<UserResponseDto[]> {
    const users: User[] = await this.usersRepository.find();
    const responseUsers: UserResponseDto[] = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    }));

    return responseUsers;
  }

  async findOneById(id: number): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return new UserResponseDto(
      user.id,
      user.name,
      user.email,
      user.role,
      user.phone,
    );
  }

  async findUser(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
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

  async disJoinCompany(userId: number, companyId: number) {
    // find user with the companies
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['companies'],
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} Not Found`);
    }

    const company = await this.company_repo.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${companyId} not found`);
    }

    // check if the user is actually associate with this company

    const companyIndex = user.companies.findIndex((c) => c.id == companyId);
    if (companyIndex === -1) {
      throw new BadRequestException(
        `You are not associate with company ID ${companyId}`,
      );
    }

    user.companies.splice(companyIndex, 1);
    //  sabe the update user
    this.usersRepository.save(user);

    return 'You are no longer a member of ' + company.name;
  }

  async getUserCompanies(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['companies'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} NOT FOUND`);
    }

    if (user.companies.length <= 0) {
      return "Your haven't joined any company";
    }

    return user.companies;
  }

  async update(
    id: number,
    updateUserDto: AdminUpdateUserDto | DriverUpdateUserDto,
    requestingUser: any,
  ) {


    console.log(requestingUser)
    const userToUpdate = await this.usersRepository.findOneBy({ id });
    if (!userToUpdate) {
      throw new NotFoundException('User not found');
    }

    if(!requestingUser){
      throw new Error("YOU have to first login in order to update driver of officer")
    }
    if (userToUpdate.role === Role.DRIVER) {
      if(!requestingUser){
        throw new Error("YOU have to first login in order to update driver of officer")
      }
      // Driver update logic
      await this.updateDriver(id, updateUserDto, requestingUser, userToUpdate);
    } else if (userToUpdate.role === Role.OFFICER) {
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

      if (!this.checkSameCompany(requestingUser, userToUpdate)) {
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

  private async updateNormalUser(
    id: number,
    updateUserDto: AdminUpdateUserDto | DriverUpdateUserDto,
    userToUpdate: any,
  ) {
    const normalUserUpdateDto = updateUserDto as AdminUpdateUserDto;
    userToUpdate.name = normalUserUpdateDto.name || userToUpdate.name;
    userToUpdate.email = normalUserUpdateDto.email || userToUpdate.email;
    userToUpdate.phone = normalUserUpdateDto.phone || userToUpdate.phone;
    await this.usersRepository.save(userToUpdate);
  }

  private checkSameCompany(user1: any, user2: any): boolean {
    // Check if user1 and user2 share a company
    if (!user1.companies || !user2.companies) {
      return false;
    }
    for (const company1 of user1.companies) {
      for (const company2 of user2.companies) {
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
  }
}
