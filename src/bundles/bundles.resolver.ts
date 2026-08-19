import { BadRequestException, UseGuards } from '@nestjs/common';
import {
  Args,
  ArgsType,
  Context,
  Field,
  Query,
  ResolveField,
  Resolver,
  Parent,
} from '@nestjs/graphql';

import { GqlAuthGuard } from '../auth/gql.guard';
import { CurrencyCode } from '../inventory/enums/CurrencyCode.enum';

import { Bundle } from './entities/bundle.entity';
import { BundlesService } from './bundles.service';

@ArgsType()
class GetBundlesForProductArgs {
  @Field(() => String)
  productUUID: string;

  @Field(() => String, { defaultValue: CurrencyCode.QAR })
  currency: CurrencyCode;

  @Field(() => String, { nullable: true })
  countryCode?: string;

  @Field(() => String, { defaultValue: 'en' })
  language: string;
}

@UseGuards(GqlAuthGuard)
@Resolver(() => Bundle)
export class BundlesResolver {
  constructor(private readonly bundlesService: BundlesService) {}

  @Query(() => [Bundle])
  getBundlesForProduct(
    @Context() context: any,
    @Args() args: GetBundlesForProductArgs,
  ): Promise<Array<Bundle>> {
    if (!context.req?.customer?.uuid) {
      throw new BadRequestException({
        error: 'Failed to find the customer. Please check and try again',
      });
    }

    return this.bundlesService.findBundlesForProduct(
      args.productUUID,
      args.currency,
      args.countryCode,
    );
  }

  @ResolveField('title', () => String)
  getTitle(
    @Parent() bundle: Bundle,
    @Args('language', { type: () => String, nullable: true }) language?: string,
  ): string {
    const normalized = String(language || 'en').toLowerCase();
    return normalized === 'ar' ? bundle.titleAr : bundle.titleEn;
  }

  @ResolveField('brief', () => String, { nullable: true })
  getBrief(
    @Parent() bundle: Bundle,
    @Args('language', { type: () => String, nullable: true }) language?: string,
  ): string | null {
    const normalized = String(language || 'en').toLowerCase();
    return normalized === 'ar' ? bundle.briefAr : bundle.briefEn;
  }
}
