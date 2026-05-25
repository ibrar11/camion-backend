import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

import { Customer } from '../customers/entities/customer.entity';
import { CustomersService } from '../customers/customers.service';

import { Affiliate } from './entities/affiliate.entity';
import { AffiliatesService } from './affiliates.service';
import { AffiliatesController } from './affiliates.controller';
import { AffiliatesResolver } from './affiliates.resolver';

import { Wallet } from './entities/wallet.entity';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';

import { Transaction } from './entities/transaction.entity';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TransactionsResolver } from './transactions.resolver';

import { Coupon } from './entities/coupon.entity';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';
import { CouponsResolver } from './coupons.resolver';

import { BankAccount } from './entities/bank-account.entity';
import { BankAccountsService } from './bank-accounts.service';
import { BankAccountsController } from './bank-accounts.controller';
import { BankAccountsResolver } from './bank-accounts.resolver';

import { GlobalCoupon } from './entities/global-coupon.entity';
import { GlobalCouponService } from './global-coupon.service';
import { GlobalCouponController } from './global-coupon.controller';

import { ClientsModule } from '../clients/clients.module';
import { OrderModule } from '../order/order.module';

@Module({
	imports: [
		TypeOrmModule.forFeature([
			Affiliate,
			BankAccount,
			Coupon,
			Customer,
			GlobalCoupon,
			Transaction,
			User,
			Wallet,
		]),
		ClientsModule,
		OrderModule,
	],
	providers: [
		AffiliatesResolver,
		AffiliatesService,
		BankAccountsResolver,
		BankAccountsService,
		CouponsResolver,
		CouponsService,
		CustomersService,
		GlobalCouponService,
		TransactionsResolver,
		TransactionsService,
		UsersService,
		WalletService,
	],
	controllers: [
		AffiliatesController,
		BankAccountsController,
		CouponsController,
		GlobalCouponController,
		TransactionsController,
		WalletController,
	],
})
export class ReferralModule { }
