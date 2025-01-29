// src/clients/clients.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientsRepository: Repository<Client>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async create(clientData: Partial<Client>): Promise<Client> {
    const client = this.clientsRepository.create(clientData);
    await this.clientsRepository.save(client);

    // Notify the new client
    this.notificationsGateway.notifyUser( client.id, `Welcome, ${client.name}! You are now registered as a client.`);

    return client;
  }

  async findAll(): Promise<Client[]> {
    return this.clientsRepository.find();
  }

  async findOne(clientId: number): Promise<Client> {
    const client = await this.clientsRepository.findOne({ where: { id: clientId } });
    // const foundUser = await this.userRepository.findOne({ where: { id: userId } });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  async update(id:  number, updateData: Partial<Client>): Promise<Client> {
    const client = await this.findOne(id);
    Object.assign(client, updateData);
    await this.clientsRepository.save(client);
    // Notify the client about the update
    this.notificationsGateway.notifyUser(client.id, `Your profile has been updated.`);

    return client;
  }

  async remove(id: number): Promise<void> {
    const client = await this.findOne(id);
    await this.clientsRepository.remove(client);
    // Notify the client about account deletion
    this.notificationsGateway.notifyUser(client.id, `Your account has been deleted.`);
  }
}