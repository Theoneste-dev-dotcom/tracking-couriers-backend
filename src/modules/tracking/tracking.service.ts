import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShipmentUpdate } from './entities/shipment-update.entity';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { UpdateTrackingDto } from './dto/update-tracking.dto';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(ShipmentUpdate)
    private readonly trackingRepository: Repository<ShipmentUpdate>,
  ) {}
  
  async create(createShipmentUpdateDto: CreateTrackingDto): Promise<ShipmentUpdate> {
    const shipmentUpdate = this.trackingRepository.create(createShipmentUpdateDto);
    return this.trackingRepository.save(shipmentUpdate);
  }



  async updateLocation(createTrackingDto: UpdateTrackingDto) {
    const trackingUpdate = this.trackingRepository.create(createTrackingDto);
    return await this.trackingRepository.save(trackingUpdate);
  }

  async getShipmentUpdates(shipmentId: number) {
    return await this.trackingRepository.findOne({
      where: { id: shipmentId },
    });
  }

  async findAll(): Promise<ShipmentUpdate[]> {
    return this.trackingRepository.find();
  }

  async findOne(id: number): Promise<ShipmentUpdate> {
    const shipmentUpdate = await this.trackingRepository.findOneBy({ id });
    if (!shipmentUpdate) {
      throw new NotFoundException(`ShipmentUpdate with ID ${id} not found`);
    }
    return shipmentUpdate;
  }

  async update(id: number, updateShipmentUpdateDto: UpdateTrackingDto): Promise<ShipmentUpdate> {
    await this.trackingRepository.update(id, updateShipmentUpdateDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.trackingRepository.delete(id);
  }
}
