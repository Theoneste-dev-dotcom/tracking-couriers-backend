import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Put,
  Query,
} from '@nestjs/common';
import { UserService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../auth/auth.guard';
import {
  AdminUpdateUserDto,
  DriverUpdateUserDto,
} from './dto/update-user1.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { UserResponseDto } from './dto/user-reponse.dto';
import { User } from './entities/user.entity';
import { AssignRoleDto } from './dto/assing-role.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @Request() req,
    @Query('companyId') companyId?: number,
    @Query('currentId') currentId?: number,
  ) {
    if (currentId) {
      const currentUser = await this.usersService.findOneById(currentId);
      return this.usersService.createUser(
        createUserDto,
        currentUser,
        companyId,
      );
    }
    return   await this.usersService.createUser(createUserDto, req.user, companyId);
   
  }

  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @Get()
  async findAll(
    @Query('companyId') companyId?: string,
    @Query('role') role?: Role,
  ) {
    const users = await this.usersService.findAllByTypeAndCompany(role, companyId);
    return  users.map((user) => this.mapToDto(user));
  }
  
  @UseGuards(AuthGuard)
  @Get(':email')
  findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }


  
  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: number) {
    const user = await this.usersService.findOneById(id);
    return  this.mapToDto(user);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateUserDto: AdminUpdateUserDto | DriverUpdateUserDto,
    @Request() req,
    @Query('currentId') currentId?:number
  ) {
    if(currentId) {
      const currentUser = await this.usersService.findUser(currentId);
      return this.usersService.update(id, updateUserDto, currentUser);
    }
    return this.usersService.update(id, updateUserDto, req.user);
  }



  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN, Role.CLIENT, Role.COMPANY_OWNER)
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.usersService.remove(id);
  }


  @Post(':id/assign-role')
  @Roles(Role.ADMIN)
  async assignRole(
    @Param('id') id: number,
    @Body('role') assignRoleDto: AssignRoleDto
  ): Promise<UserResponseDto> {
    const user = await this.usersService.assignRole(id, assignRoleDto);
    return this.mapToDto(user);
  }
  // @Get(':id/companies')
  // getCompaniesById(@Param('id') id: number) {
  //   return this.usersService.getUserCompanies(Number(id));
  // }

  // @Get('email/:email/companies')
  // getCompaniesByEmail(@Param('email') userEmail:string) {
  //   return this.usersService.getUserCompaniesByEmail(userEmail);
  // }

  // @Put('disjoin/:userId/:companyId')
  // disJoinCompany(
  //   @Param('userId') userid: number,
  //   @Param('companyId') companyId: number,
  // ) {
  //   return this.usersService.disJoinCompany(userid, companyId);
  // }


  private mapToDto(user: User): UserResponseDto {
    const dto = new UserResponseDto(user.id, user.name, user.email, user.role, user.phone);
    switch (user.role) {
      case Role.DRIVER:
        dto.companyId = user.driverInCompany?.id;
        break;
      case Role.OFFICER:
        dto.companyId = user.officerInCompany?.id;
        break;
      case Role.CLIENT:
        dto.companyIds = user.clientOfCompanies?.map(c => c.id);
        break;
      case Role.COMPANY_OWNER:
        dto.ownedCompanyId = user.ownedCompany?.id;
        break;
    }

    return dto;
  }
}
