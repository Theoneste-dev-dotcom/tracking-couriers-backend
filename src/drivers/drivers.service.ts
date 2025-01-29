// src/drivers/drivers.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from './entities/driver.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private driversRepository: Repository<Driver>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(driverData: Partial<Driver>): Promise<Driver> {
    const driver = this.driversRepository.create(driverData);
    await this.driversRepository.save(driver);

    // Notify the new driver
    this.notificationsGateway.notifyUser(driver.id, `Welcome, ${driver.name}! You are now registered as a driver.`);

    return driver;
  }

  async findAll(): Promise<Driver[]> {
    return this.driversRepository.find();
  }

  async findOne(driverId: number): Promise<Driver> {
    const driver = await this.driversRepository.findOne({ where: { id: driverId } });
    if (!driver) {
      throw new NotFoundException('Driver not found');
    }
    return driver;
  }

  async update(id: string, updateData: Partial<Driver>): Promise<Driver> {
    const driver = await this.findOne(id);
    Object.assign(driver, updateData);
    await this.driversRepository.save(driver);

    // Notify the driver about the update
    this.notificationsGateway.notifyUser(driver.id, `Your profile has been updated.`);

    return driver;
  }

  async remove(id: string): Promise<void> {
    const driver = await this.findOne(id);
    await this.driversRepository.remove(driver);

    // Notify the driver about account deletion
    this.notificationsGateway.notifyUser(driver.id, `Your account has been deleted.`);
  }
}