import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, ParseIntPipe, UseFilters } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';

import { AuthGuard } from '../auth/auth.guard';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { SubscriptionGuard } from 'src/common/guards/subscription.guard';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from 'src/common/enums/role.enum';
import { SubscriptionService } from '../subscription/subscription.service';
import { SubscriptionFilter } from 'src/common/filters/subscription.filter';
import { SubscriptionPlan } from 'src/common/enums/subscription-plan.enum';
import { Subscription } from 'src/common/decorators/subscription.decorator';

@Controller('shipments')
@UseGuards(AuthGuard, SubscriptionGuard)
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Roles(Role.ADMIN, Role.CLIENT, Role.DRIVER, Role.OFFICER)
  // @Subscription(SubscriptionPlan.BASIC, SubscriptionPlan.PREMIUM)
  // SubscriptionGuard
  @UseGuards(AuthGuard)
  @Post(":userId/:companyId")
  async createShipment(@Body() createShipmentDto: CreateShipmentDto, @Param('userId') userId:number, @Param("companId") companyId:number) {
    return await this.shipmentsService.create(createShipmentDto, userId, companyId);
  }
  
  @UseGuards(AuthGuard,RolesGuard)
  @Get()
  async getAllShipments() {
    return await this.shipmentsService.findAll();
  }
  
  @UseGuards(AuthGuard)
  @Get(':id')
  async getShipment(@Param('id', ParseIntPipe) id: number) {
    return await this.shipmentsService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Put(':id')
  async updateShipment(@Param('id', ParseIntPipe) id: number, @Body() updateShipmentDto: UpdateShipmentDto) {
    return await this.shipmentsService.update(id, updateShipmentDto);
  }

  @UseGuards(RolesGuard, AuthGuard)
  @Roles(Role.ADMIN, Role.CLIENT, Role.OFFICER)
  @Delete(':id')
  async deleteShipment(@Param('id', ParseIntPipe) id: number) {
    return await this.shipmentsService.remove(id);
  }
}
