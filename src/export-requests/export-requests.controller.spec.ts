import { Test, TestingModule } from '@nestjs/testing';
import { ExportRequestsController } from './export-requests.controller';

describe('ExportRequestsController', () => {
  let controller: ExportRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportRequestsController],
    }).compile();

    controller = module.get<ExportRequestsController>(ExportRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
