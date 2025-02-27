import { Controller, Post, Get, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { CreateTrackingDto } from './dto/create-tracking.dto';
import { AuthGuard } from '../auth/auth.guard';
import { SubscriptionGuard } from 'src/common/guards/subscription.guard';

@Controller('tracking')
@UseGuards(AuthGuard, SubscriptionGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Post()
  async updateShipmentLocation(@Body() createTrackingDto: CreateTrackingDto) {
    return await this.trackingService.updateLocation(createTrackingDto);
  }

  @Get(':shipmentId')
  async getShipmentTracking(@Param('shipmentId', ParseIntPipe) shipmentId: number) {
    return await this.trackingService.getShipmentUpdates(shipmentId);
  }
}
