import { randomBytes } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

import { Client } from './entities/client.entity';

import { ClientStatus } from './enums/client-status';

@Injectable()
export class ClientsService {
    constructor(
        @InjectRepository(Client)
        private readonly clientRepository: Repository<Client>,
    ) { }

    /**
     * Creates a new client with a generated secret.
     *
     * @param body - Data to create the client
     * @returns An object containing the client's UUID, name, and plaintext secret
     */
    async createClient(body: CreateClientDto): Promise<{ uuid: string; name?: string; secret: string }> {
        const plainSecret = randomBytes(48).toString('hex');
        const hashedSecret = await bcrypt.hash(plainSecret, 10);

        const client = this.clientRepository.create({
            uuid: crypto.randomUUID(),
            name: body.name,
            description: body.description,
            homepage: body.homepage,
            secret: hashedSecret,
        });

        await this.clientRepository.save(client);

        return {
            uuid: client.uuid,
            secret: plainSecret,
        };
    }

    /**
     * Retrieves all clients.
     *
     * @returns Array of clients with selected fields
     */
    findAll(): Promise<Client[]> {
        return this.clientRepository.find({
            select: ['uuid', 'name', 'description', 'homepage', 'status'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Retrieves a client by UUID.
     *
     * @param uuid - The UUID of the client to retrieve
     * @returns The client entity
     * @throws NotFoundException if client does not exist
     */
    async findOne(uuid: string): Promise<Client> {
        const client = await this.clientRepository.findOne({
            where: { uuid: uuid },
            select: ['uuid', 'name', 'description', 'homepage', 'status'],
        });
        if (client === null) {
            throw new NotFoundException({
                error: "Failed to find the client. Please check and try again.",
            });
	    }
        return client;
    }

    /**
     * Updates a client with the given fields.
     *
     * @param uuid - The UUID of the client to update
     * @param dto - The fields to update
     * @returns The updated client entity
     */
    async update(uuid: string, dto: UpdateClientDto): Promise<Client> {
        const client = await this.clientRepository.findOne({
            where: { uuid: uuid },
        });

        if (client === null) {
            throw new NotFoundException({
                error: "Failed to find the client. Please check and try again.",
            });
	    }

        return this.clientRepository.save(client);
    }

    /**
     * Updates the status of a client.
     *
     * @param uuid - The UUID of the client
     * @param status - The new status to assign
     * @returns The updated client entity
     */
    async updateStatus(uuid: string, status: ClientStatus): Promise<Client> {
        const client = await this.clientRepository.findOne({
            where: { uuid: uuid },
        });

        if (!client) {
            throw new NotFoundException(`Client ${uuid} not found`);
        }

        client.status = status;

        return this.clientRepository.save(client);
    }

    /**
     * Deletes a client by UUID. 
     * DELETE operations are idempotent; no error is thrown if the client does not exist.
     *
     * @param uuid - The UUID of the client to delete
     */
    async delete(uuid: string): Promise<void> {
        await this.clientRepository.delete({ uuid: uuid });
    }
}
