import { length } from 'class-validator';
import * as crypto from 'node:crypto';
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { SavedCard } from './entities/saved-card.entity';
import { Customer } from '../customers/entities/customer.entity';

import { getSkipAndTake } from 'src/common/pagination';
import { ConfigService } from '@nestjs/config';
import { SkipCashCard } from './types';

@Injectable()
export class SavedCardsService {
    private readonly logger = new Logger(SavedCardsService.name);

    constructor(
        @InjectRepository(SavedCard) private readonly savedCardRepository: Repository<SavedCard>,
        @InjectRepository(Customer) private readonly customerRepository: Repository<Customer>,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Save a card token from SkipCash payment
     */
    async saveCardToken(
        customer: Customer,
        tokenId: string,
    ): Promise<SavedCard> {
        try {
            this.logger.log(`Saving card token ${tokenId} for customer ${customer.uuid}`);

            // Check if token already exists
            const existing = await this.savedCardRepository.findOne({
                where: { tokenId },
            });

            if (existing) {
                this.logger.log(`card is already saved with token ${tokenId} for customer ${customer.uuid}`);
                // Reactivate if soft-deleted
                existing.isActive = true;
                return this.savedCardRepository.save(existing);
            }

            // Check if this is the first card for this customer
            const count = await this.savedCardRepository.count({
                where: { customer: { id: customer.id }, isActive: true },
            });

            const savedCard = new SavedCard();
            savedCard.uuid = crypto.randomUUID();
            savedCard.customer = customer;
            savedCard.tokenId = tokenId;
            savedCard.isActive = true;
            savedCard.isDefault = count === 0; // First card becomes default

            return this.savedCardRepository.save(savedCard);
        } catch (error: any) {
            this.logger.error(`Error saving card: ${error?.response?.data || error.message}`);
            throw error;
        }
    }

    /**
     * Get all saved cards for a customer
     *
     * @param customerUUID
     * @param pageNumber
     * @param itemsPerPage
     * @returns
     */
    async getSavedCards(customerUUID: string, pageNumber: number = 1, itemsPerPage: number = 100): Promise<Array<SavedCard>> {
        this.logger.log(`Retrieving customer addresses for customer: ${customerUUID}`);

        // Find the customer
        const customer = await this.customerRepository.findOneBy({ uuid: customerUUID });
        if (customer === null) {
            throw new NotFoundException({
                error: "Failed to find the customer. Please check and try again.",
            });
        }

        // Get pagination params
        const { skip, take } = getSkipAndTake(pageNumber, itemsPerPage);

        const cards = await this.savedCardRepository.find({
            where: {
                isActive: true,
                customer: {
                    id: customer.id,
                },
            },
            relations: {
                customer: true,
            },
            order: {
                id: "DESC",
            },
            skip: skip,
            take: take,
        });

        if (!cards.length) {
            throw new NotFoundException(
                'Could not found any saved cards',
            );
        }

        let cardsTokenString = '';

        cards.forEach((card, index) => {
            cardsTokenString = (index === cards.length - 1) ? cardsTokenString + card.tokenId : cardsTokenString + card.tokenId + "|";
        })

        const res = await fetch(`${this.configService.get<string>("SKIPCASH_BASE_URL")}/token/cardDetails/${cardsTokenString}`, {
            method: "GET",
        });
        const data = await res.json();
        this.logger.log(`After hitting skipcash fetch card detail api ${data}`);

        if (!res.ok || data.hasError) {
            let message = "Payment creation failed";

            if (data?.error?.message) {
                message = `SkipCash error: ${data.error.message}`;
            } else if (data?.errorMessage) {
                message = `SkipCash error: ${data.errorMessage}`;
            } else if (res.status === 403) {
                message = "Forbidden: Signature does not match or invalid credentials";
            }

            throw new InternalServerErrorException(
                message,
            );
        }

        const savedCards: Array<SkipCashCard> = data.resultObj;

        if (!savedCards.length) {
            throw new NotFoundException(
                'Saved cards not found on skipcash',
            );
        }

        savedCards.forEach((card, index) => {
            const [expiryMonth, expiryYear] = card.cardExpiry.split("/");

            cards[index].cardBrand = card.cardType === 1 ? "Visa Card" : "MasterCard";
            cards[index].last4 = card.cardNumber;
            cards[index].expiryMonth = expiryMonth;
            cards[index].expiryYear = expiryYear;
        })

        return cards;
    }

    /**
     * Get all saved cards for a customer
     *
     * @param customerUUID
     * @param pageNumber
     * @param itemsPerPage
     * @returns
     */
    async getAllSavedCards(): Promise<Array<SavedCard>> {
        this.logger.log(`Retrieving all saved cards`);

        const cards = await this.savedCardRepository.find({
            relations: {
                customer: true,
            }
        });

        this.logger.log(`Retrieved all ${cards.length} saved cards`);

        if (!cards.length) {
            throw new NotFoundException(
                'Could not found any saved cards',
            );
        }

        let cardsTokenString = '';

        cards.forEach((card, index) => {
            cardsTokenString = (index === cards.length - 1) ? cardsTokenString + card.tokenId : cardsTokenString + card.tokenId + "|";
        })

        const res = await fetch(`${this.configService.get<string>("SKIPCASH_BASE_URL")}/token/cardDetails/${cardsTokenString}`, {
            method: "GET",
        });
        const data = await res.json();
        this.logger.log(`After hitting skipcash fetch card detail api ${data}`);

        if (!res.ok || data.hasError) {
            let message = "Payment creation failed";

            if (data?.error?.message) {
                message = `SkipCash error: ${data.error.message}`;
            } else if (data?.errorMessage) {
                message = `SkipCash error: ${data.errorMessage}`;
            } else if (res.status === 403) {
                message = "Forbidden: Signature does not match or invalid credentials";
            }

            throw new InternalServerErrorException(
                message,
            );
        }

        const savedCards: Array<SkipCashCard> = data.resultObj;

        if (!savedCards.length) {
            throw new NotFoundException(
                'Saved cards not found on skipcash',
            );
        }

        savedCards.forEach((card, index) => {
            const [expiryMonth, expiryYear] = card.cardExpiry.split("/");

            cards[index].cardBrand = card.cardType === 1 ? "Visa Card" : "MasterCard";
            cards[index].last4 = card.cardNumber;
            cards[index].expiryMonth = expiryMonth;
            cards[index].expiryYear = expiryYear;
        })

        return cards;
    }

    /**
     * Get a single saved card by UUID
     */
    async getSavedCard(customerUuid: string, cardUuid: string): Promise<SavedCard> {
        const card = await this.savedCardRepository.findOne({
            where: {
                uuid: cardUuid,
                customer: { uuid: customerUuid },
                isActive: true,
            },
            relations: {
                customer: true
            }
        });

        if (!card) {
            throw new NotFoundException({
                error: 'card not found',
            });
        }

        if (!card.isActive) {
            throw new BadRequestException({
                error: 'card has been deleted',
            });
        }

        const res = await fetch(`${this.configService.get<string>("SKIPCASH_BASE_URL")}/token/cardDetails/${card.tokenId}`, {
            method: "GET",
        });
        const data = await res.json();
        this.logger.log(`After hitting skipcash fetch card detail api ${data}`);

        if (!res.ok || data.hasError) {
            let message = "Payment creation failed";

            if (data?.error?.message) {
                message = `SkipCash error: ${data.error.message}`;
            } else if (data?.errorMessage) {
                message = `SkipCash error: ${data.errorMessage}`;
            } else if (res.status === 403) {
                message = "Forbidden: Signature does not match or invalid credentials";
            }

            throw new InternalServerErrorException(
                message,
            );
        }

        const savedCard = data.resultObj[0] ?? data.resultObj;

        if (!savedCard) {
            throw new NotFoundException({
                error: 'Saved card not found on skipcash',
            });
        }

        const [expiryMonth, expiryYear] = savedCard.cardExpiry.split("/");

        card.cardBrand = savedCard.cardType === 1 ? "Visa Card" : "MasterCard";
        card.last4 = savedCard.cardNumber;
        card.expiryMonth = expiryMonth;
        card.expiryYear = expiryYear;


        return card;
    }

    /**
     * Soft delete a saved card
     */
    async deleteSavedCard(customerUuid: string, cardUuid: string): Promise<void> {
        const card = await this.savedCardRepository.findOne({
            where: {
                uuid: cardUuid,
                customer: { uuid: customerUuid },
                isActive: true,
            },
        });

        if (!card) {
            throw new NotFoundException({
                error: 'Saved card not found',
            });
        }

        card.isActive = false;
        await this.savedCardRepository.save(card);

        // If this was the default card, set another as default
        if (card.isDefault) {
            const nextCard = await this.savedCardRepository.findOne({
                where: {
                    customer: { uuid: customerUuid },
                    isActive: true,
                },
                order: { createdAt: 'ASC' },
            });

            if (nextCard) {
                nextCard.isDefault = true;
                await this.savedCardRepository.save(nextCard);
            }
        }
    }

    /**
     * Set a card as default
     */
    async setDefaultCard(customerUuid: string, cardUuid: string): Promise<SavedCard> {
        // Clear all default flags for this customer
        await this.savedCardRepository.update(
            { customer: { uuid: customerUuid }, isActive: true },
            { isDefault: false },
        );

        // Set the selected card as default
        const card = await this.getSavedCard(customerUuid, cardUuid);
        card.isDefault = true;
        return this.savedCardRepository.save(card);
    }
}