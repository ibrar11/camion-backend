import { Injectable, Logger } from '@nestjs/common';
import { getIsoCountryCode, IsoCountryCode } from '../customers/enums/ISOCountryCode.enum';
import { getIsoStateCode } from '../customers/enums/ISOStateCode.enum';

export interface NormalizedAddress {
    country: string;      // ISO 3166-1 alpha-2 (e.g., "QA")
    state: string;        // ISO 3166-2 state code (e.g., "DA")
    city: string;         // Original city name (max 40 chars)
    streetAddress: string; // Original street (max 60 chars)
    postalCode: string;   // Original postal code (max 5 chars)
    fullName: string;     // Recipient name (max 60 chars)
    phoneNumber: string;  // Formatted phone number (max 15 chars)
}

@Injectable()
export class AddressNormalizationService {
    private readonly logger = new Logger(AddressNormalizationService.name);

    /**
     * Normalize address for SkipCash payment
     * Converts full country/state names to ISO codes
     */
    normalizeForPayment(address: {
        country: string;
        state: string;
        city: string;
        streetAddress: string;
        postalCode: string;
        fullName: string;
        phoneNumber: string;
    }): NormalizedAddress {
        this.logger.log(`Normalizing address for payment: ${address.country}, ${address.state}`);

        // 1. Normalize country to ISO code
        let countryCode = getIsoCountryCode(address.country);

        if (!countryCode) {
            this.logger.warn(`Unknown country: ${address.country}, defaulting to 'QA'`);
            countryCode = IsoCountryCode.QA; // Default to Qatar
        }

        // 2. Normalize state to ISO code
        let stateCode = getIsoStateCode(countryCode, address.state);

        if (!stateCode) {
            this.logger.warn(`Unknown state: ${address.state} for country ${countryCode}, using original`);
            stateCode = address.state.substring(0, 2).toUpperCase();
        }

        // 3. Truncate fields to meet SkipCash limits
        // Total address length must not exceed 50 characters
        const addressLine = `${address.streetAddress}, ${address.city}`;
        const truncatedAddress = addressLine.length > 50
            ? addressLine.substring(0, 47) + '...'
            : addressLine;

        return {
            country: countryCode,
            state: stateCode,
            city: address.city.substring(0, 40),
            streetAddress: truncatedAddress.substring(0, 60),
            postalCode: address.postalCode.substring(0, 5),
            fullName: address.fullName.substring(0, 60),
            phoneNumber: this.normalizePhoneNumber(address.phoneNumber),
        };
    }

    /**
     * Normalize phone number for SkipCash
     * - Max 15 characters
     * - Must include country code with '+'
     */
    private normalizePhoneNumber(phone: string): string {
        // Remove all spaces and special chars except +
        let normalized = phone.replace(/[^\d+]/g, '');

        // Ensure it starts with +
        if (!normalized.startsWith('+')) {
            // Check if it's a Qatari number without code
            if (normalized.startsWith('3') || normalized.startsWith('5') || normalized.startsWith('6') || normalized.startsWith('7')) {
                normalized = '+974' + normalized;
            } else if (normalized.length === 8 || normalized.length === 9) {
                normalized = '+974' + normalized;
            } else {
                normalized = '+' + normalized;
            }
        }

        // Truncate to 15 characters
        return normalized.substring(0, 15);
    }
}