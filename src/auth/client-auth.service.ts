import * as crypto from "node:crypto";

import * as bcrypt from "bcrypt";

import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
} from "@nestjs/common";

import { ConfigService } from "@nestjs/config";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { JwtService } from "@nestjs/jwt";

import { ClientTokenDto } from "./dtos/ClientTokenDto";

import { Client } from "../clients/entities/client.entity";
import { ClientAuthResponse } from "./response/ClientAuthResponse";

@Injectable()
export class ClientAuthService {
    private readonly logger = new Logger(ClientAuthService.name);

    constructor(
        @InjectRepository(Client) private readonly clientRepository: Repository<Client>,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
    ) { }

    /**
     * Register a new user
     *
     * @param body
     * @returns
     */
    async getToken(body: ClientTokenDto): Promise<ClientAuthResponse> {
        this.logger.log(`Attempting to login client: ${body}`);

        const clientByUUID = await this.clientRepository.findOneBy({
            uuid: body.clientId.trim(),
        });

        if (clientByUUID === null) {
            throw new BadRequestException({
                errors: {
                    deviceId: "Client cannot be found. Please register client.",
                },
            });
        }

        // Match the password of the user
        if (!bcrypt.compareSync(body.clientSecret, clientByUUID.secret)) {
            throw new BadRequestException({
                error: "Invalid client secret.",
            });
        }

        // Create the payload
        const payload = {
            jti: crypto.randomUUID(),
            type: "client",
            sub: clientByUUID.uuid,
        };

        // Create the jwt for the client
        const token = await this.jwtService.signAsync(payload, {
            expiresIn: "365d",
        });
        
        return {
            token: token,
            client: clientByUUID,
        };
    }
}
