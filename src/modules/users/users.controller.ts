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
    return this.usersService.createUser(createUserDto, req.user, companyId);
  }

  @UseGuards(AuthGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.usersService.findOneById(id);
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
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.usersService.remove(id);
  }

  @Get(':id/companies')
  getCompanies(@Param('id') id: number) {
    return this.usersService.getUserCompanies(Number(id));
  }

  @Put('disjoin/:userId/:companyId')
  disJoinCompany(
    @Param('userid') userid: number,
    @Param('companyId') companyId: number,
  ) {
    return this.usersService.disJoinCompany(userid, companyId);
  }
}
