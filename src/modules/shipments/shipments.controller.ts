import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';

import { AuthGuard } from '../auth/auth.guard';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { SubscriptionGuard } from 'src/common/guards/subscription.guard';
import { UpdateShipmentDto } from './dto/update-shipment.dto';

@Controller('shipments')
@UseGuards(AuthGuard, SubscriptionGuard)
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Post()
  async createShipment(@Body() createShipmentDto: CreateShipmentDto) {
    return await this.shipmentsService.create(createShipmentDto);
  }

  @Get()
  async getAllShipments() {
    return await this.shipmentsService.findAll();
  }

  @Get(':id')
  async getShipment(@Param('id', ParseIntPipe) id: number) {
    return await this.shipmentsService.findOne(id);
  }

  @Put(':id')
  async updateShipment(@Param('id', ParseIntPipe) id: number, @Body() updateShipmentDto: UpdateShipmentDto) {
    return await this.shipmentsService.update(id, updateShipmentDto);
  }

  @Delete(':id')
  async deleteShipment(@Param('id', ParseIntPipe) id: number) {
    return await this.shipmentsService.remove(id);
  }
}
