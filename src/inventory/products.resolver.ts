import {
	Inject,
	UseGuards,
} from "@nestjs/common";

import {
	Args,
	ArgsType,
	Field,
	Int,
	Parent,
	Query,
	ResolveField,
	Resolver,
} from "@nestjs/graphql";

import { Product } from "./entities/product.entity";
import { ProductOption } from "./entities/product-option.entity";
import { ProductOptionValue } from "./entities/product-option-value.entity";
import { ProductVariant } from "./entities/product-variant.entity";

import { ProductsService } from "./products.service";

import { GqlAuthGuard } from "../auth/gql.guard";

@ArgsType()
export class GetProductsArgs {
	@Field({ defaultValue: "en-us", })
	locale: string;

	@Field({ defaultValue: "" })
	filters: string;

	@Field({ defaultValue: "" })
	sort: string;

	@Field(() => Int, { defaultValue: 1, })
	pageNumber: number;

	@Field(() => Int, { defaultValue: 100, })
	itemsPerPage: number;
}

@ArgsType()
export class GetProductArgs {
	@Field({ defaultValue: "", })
	slug: string;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => Product)
export class ProductsResolver {
	constructor(@Inject(ProductsService) private readonly productsService: ProductsService) { }

	@ResolveField("title", () => String)
	getTitle(@Parent() product: Product, @Args() args: GetProductsArgs): string {
		const locale = args.locale.toLowerCase() || "en-us";

		const titleMap = {
			"en-us": product.titleEn,
			"ar-qa": product.titleAr,
		};

		return titleMap[locale] ?? product.titleEn;
	}

	@ResolveField("brief", () => String)
	getBrief(@Parent() product: Product, @Args() args: GetProductsArgs): string {
		const locale = args.locale.toLowerCase() || "en-us";

		const briefMap = {
			"en-us": product.briefEn,
			"ar-qa": product.briefAr,
		};

		return briefMap[locale] ?? product.briefEn;
	}

	@ResolveField("description", () => String)
	getDescription(@Parent() product: Product, @Args() args: GetProductsArgs): string {
		const locale = args.locale.toLowerCase() || "en-us";

		const descriptionMap = {
			"en-us": product.descriptionEn,
			"ar-qa": product.descriptionAr,
		};

		return descriptionMap[locale] ?? product.descriptionEn;
	}

	@ResolveField("descriptionHtml", () => String)
	getDescriptionHtml(@Parent() product: Product, @Args() args: GetProductsArgs): string {
		const locale = args.locale.toLowerCase() || "en-us";

		const descriptionHtmlMap = {
			"en-us": product.descriptionHtmlEn,
			"ar-qa": product.descriptionHtmlAr,
		};

		return descriptionHtmlMap[locale] ?? product.descriptionHtmlEn;
	}

	@Query(() => [Product])
	getProducts(@Args() args: GetProductsArgs): Promise<Array<Product>> {
		return this.productsService.findAll(args.filters, args.sort, args.pageNumber, args.itemsPerPage);
	}

	@Query(() => Product, { nullable: true, })
	getProduct(@Args() args: GetProductArgs): Promise<Product> {
		return this.productsService.findOneBySlug(args.slug);
	}
}

@Resolver(() => ProductOption)
export class ProductOptionResolver {
	@ResolveField("name", () => String)
	getName(@Parent() productOption: ProductOption, @Args() args: GetProductsArgs): string {
		const locale = args.locale.toLowerCase() || "en-us";

		const nameMap = {
			"en-us": productOption.nameEn,
			"ar-qa": productOption.nameAr,
		};

		return nameMap[locale] ?? productOption.nameEn;
	}
}

@Resolver(() => ProductOptionValue)
export class ProductOptionValueResolver {
	@ResolveField("value", () => String)
	getValue(@Parent() productOptionValue: ProductOptionValue, @Args() args: GetProductsArgs): string {
		const locale = args.locale.toLowerCase() || "en-us";

		const ValueMap = {
			"en-us": productOptionValue.valueEn,
			"ar-qa": productOptionValue.valueAr,
		};

		return ValueMap[locale] ?? productOptionValue.valueAr;
	}
}

@Resolver(() => ProductVariant)
export class ProductVariantResolver {
	@ResolveField("title", () => String)
	getName(@Parent() productVariant: ProductVariant, @Args() args: GetProductsArgs): string {
		const locale = args.locale.toLowerCase() || "en-us";

		const titleMap = {
			"en-us": productVariant.titleEn,
			"ar-qa": productVariant.titleAr,
		};

		return titleMap[locale] ?? productVariant.titleEn;
	}
}
