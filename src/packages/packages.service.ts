// src/packages/packages.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Package } from './entities/package.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { ClientsService } from '../clients/clients.service';
import { DriversService } from '../drivers/drivers.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { Status } from './enums/status.enum';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package)
    private packagesRepository: Repository<Package>,
    private notificationsGateway: NotificationsGateway,
    private clientsService: ClientsService,
    private driversService: DriversService,
  ) {}

  async create(packageData: CreatePackageDto): Promise<Package> {
    const client = await this.clientsService.findOne(packageData.clientId);
    const pkg = this.packagesRepository.create({ ...packageData, client });
    await this.packagesRepository.save(pkg);

    // Notify the client
    this.notificationsGateway.notifyUser(client.id, `Your package "${pkg.name}" has been created.`);

    return pkg;
  }

  async assignPackage(packageId: string, driverId: number): Promise<Package> {
    const pkg = await this.packagesRepository.findOne({ where: { id: packageId }, relations: ['client', 'driver'] });
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    const driver = await this.driversService.findOne(driverId);
    pkg.driver = driver;
    pkg.status = Status.ASSIGNED;
    await this.packagesRepository.save(pkg);

    // Notify the driver and client
    this.notificationsGateway.notifyUser(driver.id, `You have been assigned to deliver package "${pkg.name}".`);
    this.notificationsGateway.notifyUser(pkg.client.id, `Your package "${pkg.name}" has been assigned to driver ${driver.name}.`);

    return pkg;
  }

  async updateStatus(packageId: string, status: Status): Promise<Package> {
    const pkg = await this.packagesRepository.findOne({ where: { id: packageId }, relations: ['client', 'driver'] });
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }

    pkg.status = status;
    await this.packagesRepository.save(pkg);

    // Notify the client and driver
    this.notificationsGateway.notifyUser(pkg.client.id, `Your package "${pkg.name}" is now ${status}.`);
    if (pkg.driver) {
      this.notificationsGateway.notifyUser(pkg.driver.id, `Package "${pkg.name}" is now ${status}.`);
    }

    return pkg;
  }

  async findAll(): Promise<Package[]> {
    return this.packagesRepository.find({ relations: ['client', 'driver'] });
  }

  async findOne(id: string): Promise<Package> {
    const pkg = await this.packagesRepository.findOne({ where: { id }, relations: ['client', 'driver'] });
    if (!pkg) {
      throw new NotFoundException('Package not found');
    }
    return pkg;
  }

  async remove(id: string): Promise<void> {
    const pkg = await this.findOne(id);
    await this.packagesRepository.remove(pkg);

    // Notify the client
    this.notificationsGateway.notifyUser(pkg.client.id, `Your package "${pkg.name}" has been deleted.`);
  }
}