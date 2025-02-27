import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
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

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Company)
    private company_repo: Repository<Company>
    ) {}

  async createUser(createUserDto: CreateUserDto): Promise<SignupResponseDto> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }
    const {name, phone, email, password, role } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
     name, email, password, role, phone,
    });
    await this.usersRepository.save(user);

    return new SignupResponseDto(
      'New User Created Successfull!! ',
      user.id,
      user.name,
      user.email,
      user.role,
      user.phone, // optional      
    );
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users: User[] = await this.usersRepository.find();
    const responseUsers: UserResponseDto[] = users.map((user) => ({
      id:user.id,
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
    return new UserResponseDto(user.id, user.name, user.email, user.role, user.phone)
  }

  async findUser(id:number):Promise<User> {
    const user = await this.usersRepository.findOne({where: {id}});
    if(!user) {
      throw new NotFoundException('User not found')
    }
    return user
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
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

 

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['companies'],
    });
  
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  
    try {
      
      if (updateUserDto.companies) {
        if (updateUserDto.companies.length === 0) {
          user.companies = []; 
        } else {

          const existingCompany_ids = new Set(user.companies.map(c=>c.id))

          const companies = await this.company_repo.findBy({
            id: In(updateUserDto.companies),
          });

          const unique_companies = [...user.companies];

          companies.forEach(company => {
            if(!existingCompany_ids.has(company.id)){
              unique_companies.push(company)
            }
          })
  
          if (companies.length !== updateUserDto.companies.length) {
            throw new NotFoundException('One or more companies not found');
          }
  
          user.companies = unique_companies;
        }
      }
  
     
      const { companies, ...otherUpdates } = updateUserDto;
      Object.assign(user, otherUpdates);
  
      await this.usersRepository.save(user);
  
      return { message: `User with id ${id} updated successfully` };
    } catch (error) {
      console.error('Error updating user:', error);
      throw new InternalServerErrorException('Failed to update user');
    }
  }
  

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


  async disJoinCompany(userId:number, companyId:number)  {
    // find user with the companies
    const user = await this.usersRepository.findOne({
      where : {id: userId},
      relations: ['companies']
    });

    if(!user) {
      throw new NotFoundException(`User with id ${userId} Not Found`)
    }

    const company = await this.company_repo.findOne({
      where: {id:companyId}
    });

    if(!company) {
      throw new NotFoundException( `Company with ID ${companyId} not found`)
    }

    // check if the user is actually associate with this company

    const companyIndex = user.companies.findIndex(c=> c.id == companyId)
    if(companyIndex === -1) {
      throw new BadRequestException(
        `You are not associate with company ID ${companyId}`
      );
    }
    
    user.companies.splice(companyIndex, 1 );
    //  sabe the update user
    this.usersRepository.save(user);

    return "You are no longer a member of "+company.name;
  } 


  async getUserCompanies(userId:number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId},
      relations : ['companies'],
    })

    if(!user) {
      throw new NotFoundException(`User with ID ${userId} NOT FOUND`);
    }

    if(user.companies.length <= 0) {
     return "Your haven't joined any company"
    }

    return user.companies;
  } 


  
}
