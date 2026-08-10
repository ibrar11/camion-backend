import * as crypto from 'node:crypto';
import { 
    Injectable, 
    Logger, 
    NotFoundException 
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { SavedCard } from './entities/saved-card.entity';
import { Customer } from '../customers/entities/customer.entity';

@Injectable()
export class SavedCardsService {
    private readonly logger = new Logger(SavedCardsService.name);

    constructor(
        @InjectRepository(SavedCard)
        private readonly savedCardRepository: Repository<SavedCard>,
    ) { }

    /**
     * Save a card token from SkipCash payment
     */
    async saveCardToken(
        customer: Customer,
        tokenId: string,
        cardDetails: {
            brand: string;
            last4: string;
            expiryMonth: string;
            expiryYear: string;
            cardholderName: string;
        },
    ): Promise<SavedCard> {
        this.logger.log(`Saving card token ${tokenId} for customer ${customer.uuid}`);

        // Check if token already exists
        const existing = await this.savedCardRepository.findOne({
            where: { tokenId },
        });

        if (existing) {
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
        savedCard.cardBrand = cardDetails.brand.toLowerCase();
        savedCard.last4 = cardDetails.last4;
        savedCard.expiryMonth = cardDetails.expiryMonth;
        savedCard.expiryYear = cardDetails.expiryYear;
        savedCard.cardholderName = cardDetails.cardholderName;
        savedCard.isActive = true;
        savedCard.isDefault = count === 0; // First card becomes default

        return this.savedCardRepository.save(savedCard);
    }

    /**
     * Get all saved cards for a customer
     */
    async getSavedCards(customerUuid: string): Promise<SavedCard[]> {
        return this.savedCardRepository.find({
            where: {
                customer: { uuid: customerUuid },
                isActive: true,
            },
            order: { isDefault: 'DESC', createdAt: 'DESC' },
            select: [
                'uuid',
                'tokenId',
                'cardBrand',
                'last4',
                'expiryMonth',
                'expiryYear',
                'cardholderName',
                'isDefault',
                'createdAt',
            ],
        });
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
        });

        if (!card) {
            throw new NotFoundException({
                error: 'Saved card not found',
            });
        }

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