import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Put, Request, NotFoundException, ConflictException } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Shipment } from '../shipments/entities/shipment.entity';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { AssignOwner } from '../users/dto/assign-owner.dto';


@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}


  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.COMPANY_OWNER)
  create(@Body() createCompanyDto: CreateCompanyDto, @Request() req) {
    const user:User = req.user;
    return this.companiesService.create(createCompanyDto, user);
  } 



  // assigning owner to the company with teh company id and the owner path body {userId}
  // @Put(':id/owner')
  // @UseGuards(AuthGuard,RolesGuard)
  // @Roles(Role.ADMIN, Role.COMPANY_OWNER)
  // async assignOwner(
  //   @Param('id') id: number,
  //   @Body() assignOwnerDto: AssignOwner, @Request() req) {
  //     try {
  //       await this.companiesService.assignCompanyOwner( id, assignOwnerDto.userId);

  //              return {
  //               status: 'success',
  //               message: 'Owner assigned successfully',
  //              }
  //     }catch(error) {
  //       switch (error.constructor) {
  //         case NotFoundException:
  //           throw new NotFoundException(error.message);
  //         case ConflictException:
  //           throw new ConflictException(error.message);
  //         default:
  //           throw error;
  //       }
  //     }
    
  // }



  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.companiesService.findOne(id);
  }

  // @Get(":id/users")
  // async findCompanyUsers(@Param('id')  id:number) {
  //   return this.companiesService.getCompanyUsers(id);
  // }


  @Get(':id/subscription-status')
  async checkSubscriptionStatus(@Param('id', ParseIntPipe) companyId:number) {
    return this.companiesService.checkSubscriptionStatus(companyId);
  }

  @Get(':id/shipments')
  async getShipmentsByCompanyId(@Param('id') id: number) {
    return this.companiesService.getShipmentsByCompanyId(id);
  }

 
  @UseGuards(AuthGuard)
  @Put(':id')
  update(@Param('id') id: number, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(id, updateCompanyDto);
  }


  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.companiesService.remove(id);
  }


}
