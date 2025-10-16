import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerService } from './scheduler.service';
import { ResponseService } from './response.service';
import { ResponseGateway } from '../gateways/response.gateway';

describe('SchedulerService', () => {
  let service: SchedulerService;
  const mockResponseService = {
    pingHttpBin: jest.fn(),
    getLatestResponse: jest.fn(),
  };
  const mockGateway = {
    broadcastNewResponse: jest.fn(),
    broadcastUpdatedStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        { provide: ResponseService, useValue: mockResponseService },
        { provide: ResponseGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<SchedulerService>(SchedulerService);
    jest.clearAllMocks();
  });

  it('should ping and broadcast when latest exists', async () => {
    mockResponseService.pingHttpBin.mockResolvedValue({ _id: '1' });
    mockResponseService.getLatestResponse.mockResolvedValue({ _id: '1' });
    await service.handlePingHttpBin();
    expect(mockResponseService.pingHttpBin).toHaveBeenCalled();
    expect(mockGateway.broadcastNewResponse).toHaveBeenCalledWith({ _id: '1' });
    expect(mockGateway.broadcastUpdatedStats).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    mockResponseService.pingHttpBin.mockRejectedValue(new Error('fail'));
    await expect(service.handlePingHttpBin()).resolves.not.toThrow();
  });
});
