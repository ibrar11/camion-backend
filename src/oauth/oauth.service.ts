import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    forwardRef,
    Inject,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { StringValue } from 'ms';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ConfigService } from '@nestjs/config';

import { TokenDto } from './dto/token.dto';
import { ClientsService } from '../clients/clients.service';
import { ClientRefreshToken } from './entities/oauth-refresh-token.entity';
import { ClientStatus } from 'src/clients/enums/client-status';

@Injectable()
export class OauthService {
    constructor(
        @Inject(forwardRef(() => ClientsService))
        private readonly clientsService: ClientsService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,

        @InjectRepository(ClientRefreshToken)
        private readonly refreshTokenRepository: Repository<ClientRefreshToken>,
    ) { }

    /**
     * Generates an OAuth token based on the provided grant type.
     *
     * Supports:
     * - client_credentials
     * - refresh_token
     *
     * @param body - The token request payload
     * @returns An object containing access token, refresh token, token type, and expiry
     */
    async generateToken(body: TokenDto): Promise<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
    }> {
        const { client_id, client_secret, grant_type, refresh_token } = body;

        if (grant_type === 'client_credentials') {
            if (!client_id || !client_secret) {
                throw new BadRequestException({
                    error: 'client_id and client_secret are required',
                });
            }

            return this.handleClientCredentials(client_id, client_secret);
        }

        if (grant_type === 'refresh_token') {
            if (!refresh_token) {
                throw new BadRequestException({
                    errors: {
                        refresh_token: 'refresh_token is required',
                    },
                });
            }

            return this.handleRefreshToken(refresh_token);
        }

        throw new BadRequestException({
            error: 'Unsupported grant type',
        });
    }

    /**
     * Handles client credentials flow.
     *
     * Validates client credentials and issues access and refresh tokens.
     *
     * @param client_id - The client UUID
     * @param client_secret - The client secret
     * @returns Token response containing access and refresh tokens
     */
    private async handleClientCredentials(
        client_id: string,
        client_secret: string,
    ): Promise<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
    }> {
        const client = await this.clientsService.findByUuidWithSecret(client_id);

        if (!client) {
            throw new UnauthorizedException({
                error: 'Invalid client credentials',
            });
        }

        if (client.status !== ClientStatus.ACTIVE) {
            throw new UnauthorizedException({
                error: 'Client is not active',
            });
        }

        const isMatch = await bcrypt.compare(client_secret, client.secret);
        if (!isMatch) {
            throw new UnauthorizedException({
                error: 'Invalid client credentials',
            });
        }


        const payload = {
            sub: client.uuid,
            type: 'client',
        };

        // TODO: Set this time in the env.
        // const accessTtl = this.configService.get<string>('ACCESS_TOKEN_TTL') || '48h';

        const accessTtl = '180d';

        const signOptions: JwtSignOptions = {
            algorithm: 'RS256',
            expiresIn: accessTtl as StringValue,
        };

        const accessToken = await this.jwtService.signAsync(payload, signOptions);

        const refreshToken = await this.createAndStoreRefreshToken(client.uuid);

        return {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: 'Bearer',
            expires_in: this.parseAccessTtlToSeconds(accessTtl),
        };
    }

    /**
     * Handles refresh token flow.
     *
     * Validates the refresh token, rotates it, and issues new tokens.
     *
     * @param refreshToken - The refresh token
     * @returns Token response containing new access and refresh tokens
     */
    private async handleRefreshToken(
        refreshToken: string,
    ): Promise<{
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
    }> {
        const existingToken = await this.refreshTokenRepository.findOne({
            where: { token: refreshToken },
        });

        if (!existingToken) {
            throw new UnauthorizedException({
                error: 'Invalid refresh token',
            });
        }

        if (existingToken.revoked) {
            throw new UnauthorizedException({
                error: 'Refresh token revoked',
            });
        }

        if (existingToken.expiresAt < new Date()) {
            throw new UnauthorizedException({
                error: 'Refresh token expired',
            });
        }

        const client = await this.clientsService.findByUuidWithSecret(existingToken.clientUuid);

        if (!client || client.status !== ClientStatus.ACTIVE) {
            throw new UnauthorizedException({
                error: 'Client is not active',
            });
        }

        // 🔁 rotation
        existingToken.revoked = true;
        await this.refreshTokenRepository.save(existingToken);


        const payload = {
            sub: client.uuid,
            type: 'client',
        };

        const accessTtl = this.configService.get<string>('ACCESS_TOKEN_TTL') || '48h';

        const signOptions: JwtSignOptions = {
            algorithm: 'RS256',
            expiresIn: accessTtl as StringValue,
        };

        const accessToken = await this.jwtService.signAsync(payload, signOptions);

        const newRefreshToken = await this.createAndStoreRefreshToken(client.uuid);

        return {
            access_token: accessToken,
            refresh_token: newRefreshToken,
            token_type: 'Bearer',
            expires_in: this.parseAccessTtlToSeconds(accessTtl),
        };
    }

    /**
     * Creates and stores a new refresh token for a client.
     *
     * @param clientUuid - The client UUID
     * @returns The generated refresh token
     */
    private async createAndStoreRefreshToken(clientUuid: string): Promise<string> {
        const token = randomBytes(64).toString('hex');

        const refreshDays =
            Number(this.configService.get<string>('REFRESH_TOKEN_TTL_DAYS')) || 90;

        const entity = this.refreshTokenRepository.create({
            clientUuid,
            token,
            expiresAt: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000),
        });

        await this.refreshTokenRepository.save(entity);

        return token;
    }

    /**
     * Revokes all active refresh tokens for a client.
     *
     * @param clientUuid - The client UUID
     */
    async revokeAllTokensForClient(clientUuid: string): Promise<void> {
        await this.refreshTokenRepository.update(
            { clientUuid, revoked: false },
            { revoked: true },
        );
    }

    /**
     * Converts access token TTL string (e.g., "48h", "30m", "3600s") into seconds.
     *
     * @param ttl - The TTL string
     * @returns Expiry time in seconds
     */
    private parseAccessTtlToSeconds(ttl: string): number {
        if (ttl.endsWith('h')) {
            return parseInt(ttl) * 3600;
        }
        if (ttl.endsWith('m')) {
            return parseInt(ttl) * 60;
        }
        if (ttl.endsWith('s')) {
            return parseInt(ttl);
        }
        return 3600;
    }
}
