import { Injectable } from '@nestjs/common';
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

  async updateLocation(createTrackingDto: UpdateTrackingDto) {
    const trackingUpdate = this.trackingRepository.create(createTrackingDto);
    return await this.trackingRepository.save(trackingUpdate);
  }

  async getShipmentUpdates(shipmentId: number) {
    return await this.trackingRepository.findOne({
      where: { id: shipmentId },
    });
  }
}
