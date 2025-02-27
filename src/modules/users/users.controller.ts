import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Put } from '@nestjs/common';
import { UserService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
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
  update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
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
  disJoinCompany(@Param('userid') userid:number, @Param('companyId') companyId:number) {
    return this.usersService.disJoinCompany(userid, companyId) 
  }
}
