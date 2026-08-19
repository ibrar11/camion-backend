import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class BundleAllocation {
  @Field(() => String)
  bundleUuid: string;

  @Field(() => String)
  bundleTitle: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Int)
  discountMinor: number;
}
