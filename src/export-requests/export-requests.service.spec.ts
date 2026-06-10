import { Test, TestingModule } from '@nestjs/testing';
import { ExportRequestsService } from './export-requests.service';

describe('ExportRequestsService', () => {
  let service: ExportRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportRequestsService],
    }).compile();

    service = module.get<ExportRequestsService>(ExportRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
