import {
	Args,
	ArgsType,
	Context,
	Field,
	Int,
	Query,
	Mutation,
	Resolver,
} from "@nestjs/graphql";

import {
	ForbiddenException,
	Inject,
	UseGuards,
} from "@nestjs/common";

import { GqlAuthGuard } from "../auth/gql.guard";
import { UserRole } from "../users/enums/UserRole";

import { ProductReport } from "./entities/product-report.entity";
import { ProductReportService } from "./product-report.service";
import { ProductReportReason } from "./enums/ProductReportReason.enum";
import { ProductReportStatus } from "./enums/ProductReportStatus.enum";

@ArgsType()
class CreateProductReportArgs {
	@Field(() => String)
	productUuid: string;

	@Field(() => String)
	reason: ProductReportReason;

	@Field(() => String)
	details: string;

	@Field(() => String, { nullable: true })
	orderNumber?: string;
}

@ArgsType()
class GetCurrentCustomerProductReportsArgs {
	@Field(() => Int, { defaultValue: 1 })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 20 })
	itemsPerPage: number;

	@Field(() => String, { nullable: true })
	status?: ProductReportStatus;
}

@ArgsType()
class GetAdminProductReportsArgs {
	@Field(() => Int, { defaultValue: 1 })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 20 })
	itemsPerPage: number;

	@Field(() => String, { nullable: true })
	status?: ProductReportStatus;

	@Field(() => String, { nullable: true })
	reason?: ProductReportReason;
}

@ArgsType()
class UpdateProductReportStatusArgs {
	@Field(() => String)
	uuid: string;

	@Field(() => String)
	status: ProductReportStatus;

	@Field(() => String, { nullable: true })
	adminNote?: string;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => ProductReport)
export class ProductReportResolver {
	constructor(
		@Inject(ProductReportService) private readonly productReportService: ProductReportService,
	) { }

	@Mutation(() => ProductReport)
	createProductReport(@Context() context, @Args() args: CreateProductReportArgs): Promise<ProductReport> {
		if (!context.req?.customer?.uuid) {
			throw new ForbiddenException({
				error: "You're not allowed to submit a product report.",
			});
		}

		return this.productReportService.createProductReport(context.req.customer, {
			productUuid: args.productUuid,
			reason: args.reason,
			details: args.details,
			orderNumber: args.orderNumber,
		});
	}

	@Query(() => [ProductReport])
	getCurrentCustomerProductReports(@Context() context, @Args() args: GetCurrentCustomerProductReportsArgs): Promise<Array<ProductReport>> {
		if (!context.req?.customer?.uuid) {
			throw new ForbiddenException({
				error: "You're not allowed to retrieve product reports.",
			});
		}

		return this.productReportService.findAllByCustomer(
			context.req.customer.uuid,
			args.pageNumber,
			args.itemsPerPage,
			args.status,
		);
	}

	@Query(() => ProductReport)
	getCurrentCustomerProductReport(@Context() context, @Args("uuid", { type: () => String }) uuid: string): Promise<ProductReport> {
		if (!context.req?.customer?.uuid) {
			throw new ForbiddenException({
				error: "You're not allowed to retrieve product reports.",
			});
		}

		return this.productReportService.findOneByCustomer(uuid, context.req.customer.uuid);
	}

	@Query(() => [ProductReport])
	getProductReportsAdmin(@Context() context, @Args() args: GetAdminProductReportsArgs): Promise<Array<ProductReport>> {
		const role = context.req?.user?.role as UserRole | undefined;
		if (!role || ![UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager].includes(role)) {
			throw new ForbiddenException({
				error: "You're not allowed to retrieve product reports.",
			});
		}

		return this.productReportService.findAll(args.pageNumber, args.itemsPerPage, args.status, args.reason);
	}

	@Query(() => ProductReport)
	getProductReportAdmin(@Context() context, @Args("uuid", { type: () => String }) uuid: string): Promise<ProductReport> {
		const role = context.req?.user?.role as UserRole | undefined;
		if (!role || ![UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager].includes(role)) {
			throw new ForbiddenException({
				error: "You're not allowed to retrieve product reports.",
			});
		}

		return this.productReportService.findOne(uuid);
	}

	@Mutation(() => ProductReport)
	updateProductReportStatus(@Context() context, @Args() args: UpdateProductReportStatusArgs): Promise<ProductReport> {
		const role = context.req?.user?.role as UserRole | undefined;
		if (!role || ![UserRole.SuperAdmin, UserRole.Admin, UserRole.Manager].includes(role)) {
			throw new ForbiddenException({
				error: "You're not allowed to update product reports.",
			});
		}

		return this.productReportService.updateStatus(args.uuid, {
			status: args.status,
			adminNote: args.adminNote,
		});
	}
}
