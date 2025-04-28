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
  UseInterceptors,
  UploadedFile,
  NotFoundException,
  Req,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/config/multer.config';

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
    return await this.usersService.createUser(
      createUserDto,
      req.user,
      companyId,
    );
  }

  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @Get('all')
  async findAllByRoleAndCompanyId(
    @Query('companyId') companyId: string,
    @Query('role') role: Role,
  ) {
    return await this.usersService.findAllByTypeAndCompany(role, +companyId);
    // return  users.map((user) => this.mapToDto(user));
  }

  @Get()
  @UseGuards(AuthGuard)
  async JustGetAll() {
    return this.usersService.findAll();
  }

  //get user company
  @Get('user-company')
  @UseGuards(AuthGuard)
  async getUserCompany(@Request() req) {
    return this.usersService.getUserCompany(req.user.sub);
  }

  // getting company members
  @Get('company-members')
  @UseGuards(AuthGuard)
  async getCompanyMembers(@Request() req) {
    return this.usersService.getCompanyMembers(req.user.sub, [Role.DRIVER, Role.OFFICER, Role.ADMIN, Role.COMPANY_OWNER]);
  }

  // get profile image
  @Get('profile/image')
  @UseGuards(AuthGuard)
  async getProfileImage(@Request() req) {
    const filename = await this.usersService.getProfileImage(req.user.sub);
    if (!filename) {
      throw new NotFoundException('Profile image not found');
    }
    return {
      imageUrl: `http://localhost:3001/uploads/profilepics/${filename}`,
    };
  }

  @UseGuards(AuthGuard)
  @Get('specific/user/:email')
  findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @UseGuards(AuthGuard)
  @Get('user-company/company')
  async getUserCompanies(@Request() req) {
    return this.usersService.getAssociatedCompany(req.user.sub, req.user.role);
  }

  @UseGuards(AuthGuard)
  @Get('/specific/:id')
  async findOne(@Param('id') id: number) {
    return await this.usersService.findOneById(id);
    // return  this.mapToDto(user);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  @UseInterceptors(FileInterceptor('profilePic', multerConfig))
  async update(
    @Param('id') id: number,
    @Body() updateUserDto: AdminUpdateUserDto | DriverUpdateUserDto,
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const currentUser = await this.usersService.findUser(req.user.sub);
    return this.usersService.updateUser(id, updateUserDto, currentUser, file);
  }

  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN, Role.CLIENT, Role.COMPANY_OWNER)
  @Delete(':id')
  remove(@Param('id') id: number, @Request() req) {
    if(id) return this.usersService.deleteUserById(id, req.user.sub);
    else throw new NotFoundException('User not found');
  }

  // @Post(':id/assign-role')
  // @Roles(Role.ADMIN)
  // async assignRole(
  //   @Param('id') id: number,
  //   @Body('role') assignRoleDto: AssignRoleDto
  // ): Promise<UserResponseDto> {
  //   const user = await this.usersService.assignRole(id, assignRoleDto);
  //   return this.mapToDto(user);
  // }
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

  //   private mapToDto(user: User): UserResponseDto {
  //     const dto = new UserResponseDto(user.id, user.name, user.email, user.role, user.phone);
  //     switch (user.role) {
  //       case Role.DRIVER:
  //         dto.companyId = user.driverInCompany?.id;
  //         break;
  //       case Role.OFFICER:
  //         dto.companyId = user.officerInCompany?.id;
  //         break;
  //       case Role.CLIENT:
  //         dto.companyIds = user.clientOfCompanies?.map(c => c.id);
  //         break;
  //       case Role.COMPANY_OWNER:
  //         dto.ownedCompanyId = user.ownedCompany?.id;
  //         break;
  //     }

  //     return dto;
  //   }
}
