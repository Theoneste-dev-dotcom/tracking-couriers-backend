import { Controller, Get } from '@nestjs/common';
import { ShipmentsService } from './shipments.service';


@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Get()
  async findAll() {
    return this.shipmentsService.findAll();
  }
}