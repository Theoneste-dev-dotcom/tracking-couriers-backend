// src/drivers/drivers.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { Driver } from './entities/driver.entity';

@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  create(@Body() driverData: Partial<Driver>): Promise<Driver> {
    return this.driversService.create(driverData);
  }

  @Get()
  findAll(): Promise<Driver[]> {
    return this.driversService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Driver> {
    return this.driversService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: Partial<Driver>): Promise<Driver> {
    return this.driversService.update(id, updateData);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.driversService.remove(id);
  }
}