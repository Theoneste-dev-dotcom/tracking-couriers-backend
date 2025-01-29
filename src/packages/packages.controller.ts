// src/packages/packages.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, Patch } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { Package } from './entities/package.entity';

@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  create(@Body() packageData: Partial<Package>): Promise<Package> {
    return this.packagesService.create(packageData);
  }

  @Get()
  findAll(): Promise<Package[]> {
    return this.packagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Package> {
    return this.packagesService.findOne(id);
  }

  @Patch(':id/assign')
  assignPackage(@Param('id') packageId: string, @Body('driverId') driverId: string): Promise<Package> {
    return this.packagesService.assignPackage(packageId, driverId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') packageId: string, @Body('status') status: string): Promise<Package> {
    return this.packagesService.updateStatus(packageId, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.packagesService.remove(id);
  }
}