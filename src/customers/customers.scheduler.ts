import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';

import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersScheduler {
    constructor(
        @InjectRepository(Customer)
        private readonly customerRepository: Repository<Customer>,
    ) {}

    /**
     * Runs daily to deactivate accounts marked for deletion
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleAccountDeletion() {
        const graceDays = Number(process.env.ACCOUNT_DELETION_GRACE_DAYS) || 14;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - graceDays);

        const customers = await this.customerRepository.find({
            where: {
                markedForDeletionAt: LessThan(cutoffDate),
                deletedAt: IsNull(),
            },
        });

        for (const customer of customers) {
            customer.deletedAt = new Date();
            customer.isActive = false;

            await this.customerRepository.save(customer);
        }
    }
}