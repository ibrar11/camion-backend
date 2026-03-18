import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID, randomBytes } from 'crypto';

import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
  ) {}

  /** Create a client */
  async createClient(body: CreateClientDto) {
    const uuid = randomUUID();
    const plainSecret = randomBytes(48).toString('hex');
    const hashedSecret = await bcrypt.hash(plainSecret, 10);

    const client = this.clientRepo.create({
      uuid,
      name: body.name,
      description: body.description,
      homepage: body.homepage,
      secret: hashedSecret,
      status: 'Active',
    });

    await this.clientRepo.save(client);

    return {
      uuid: client.uuid,
      name: client.name,
      secret: plainSecret,
    };
  }

  /** Get all clients */
  async findAll(): Promise<Client[]> {
    return this.clientRepo.find({
      select: ['uuid', 'name', 'description', 'homepage', 'status'],
      order: { createdAt: 'DESC' },
    });
  }

  /** Get one client by UUID */
  async findOne(uuid: string): Promise<Client> {
    const client = await this.clientRepo.findOne({
      where: { uuid },
      select: ['uuid', 'name', 'description', 'homepage', 'status'],
    });
    if (!client) throw new NotFoundException(`Client ${uuid} not found`);
    return client;
  }

  /** Update a client */
  async update(uuid: string, body: CreateClientDto): Promise<Client> {
    const client = await this.clientRepo.findOne({ where: { uuid } });
    if (!client) throw new NotFoundException(`Client ${uuid} not found`);

    Object.assign(client, body);
    return this.clientRepo.save(client);
  }

  /** Delete a client */
  async delete(uuid: string): Promise<void> {
    const result = await this.clientRepo.delete({ uuid });
    if (result.affected === 0) {
      throw new NotFoundException(`Client ${uuid} not found`);
    }
  }
}