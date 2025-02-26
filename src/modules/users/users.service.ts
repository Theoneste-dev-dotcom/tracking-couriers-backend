import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SignupResponseDto } from './dto/signup-response.dto';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<SignupResponseDto> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }
    const { email, password, role } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      role,
    });
    await this.usersRepository.save(user);

    return new SignupResponseDto(
      'New User Created Successfull!! ',
      user.email,
      user.role,
    );
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users: User[] = await this.usersRepository.find();
    const responseUsers: UserResponseDto[] = users.map((user) => ({
      email: user.email,
      role: user.role,
    }));

    return responseUsers;
  }

  async findOneById(id: number): Promise<UserResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return new UserResponseDto(user.email, user.role)
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

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const user = await this.findUser(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    try {

      Object.assign(user, updateUserDto);
      await this.usersRepository.save(user);

    } catch (error) {
      throw new InternalServerErrorException('Failed to update user');
    }

    const userResponseDto: UserResponseDto = {
      email: user.email,
      role: user.role,
    };

    return userResponseDto;
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
}
