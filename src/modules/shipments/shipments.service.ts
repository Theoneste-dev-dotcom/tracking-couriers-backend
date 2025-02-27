import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shipment } from './entities/shipment.entity';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';


@Injectable()
export class ShipmentsService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepository: Repository<Shipment>,
  ) {}

  async create(createShipmentDto: CreateShipmentDto) {
    const shipment = this.shipmentRepository.create(createShipmentDto);
    return await this.shipmentRepository.save(shipment);
  }

  async findAll() {
    return await this.shipmentRepository.find();
  }

  async findOne(id: number) {
    return await this.shipmentRepository.findOne({ where: { id } });
  }

  async update(id: number, updateShipmentDto: UpdateShipmentDto) {
    await this.shipmentRepository.update(id, updateShipmentDto);
    return await this.findOne(id);
  }

  async remove(id: number) {
    return await this.shipmentRepository.delete(id);
  }
}
