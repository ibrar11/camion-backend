import { Test, TestingModule } from '@nestjs/testing';
import { BundlesController } from './bundles.controller';

describe('BundlesController', () => {
  let controller: BundlesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BundlesController],
    }).compile();

    controller = module.get<BundlesController>(BundlesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
