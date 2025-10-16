/*
eslint-disable @typescript-eslint/no-unsafe-assignment,
               @typescript-eslint/await-thenable
*/
import { Test, TestingModule } from '@nestjs/testing';
import { ResponseGateway } from './response.gateway';
import { ResponseService } from '../services/response.service';
import { Server, Socket } from 'socket.io';

describe('ResponseGateway', () => {
  let gateway: ResponseGateway;
  const mockService = {
    getLatestResponse: jest.fn(),
    getResponseStats: jest.fn(),
  };

  const mockServer: Pick<Server, 'emit'> = { emit: jest.fn() } as any;
  const mockSocket: Pick<Socket, 'id' | 'emit'> = {
    id: 'c1',
    emit: jest.fn(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponseGateway,
        { provide: ResponseService, useValue: mockService },
      ],
    }).compile();
    gateway = module.get<ResponseGateway>(ResponseGateway);
    (gateway as unknown as { server: Server }).server = mockServer as Server;
    jest.clearAllMocks();
  });

  it('handleConnection: should emit latest to connecting client', async () => {
    mockService.getLatestResponse.mockResolvedValue({
      marketplaceData: { activeDeals: 100 },
    });
    await gateway.handleConnection(mockSocket as Socket);
    expect(mockSocket.emit).toHaveBeenCalledWith('latestResponse', {
      success: true,
      data: { activeDeals: 100 },
    });
  });

  it('broadcastNewResponse: should emit extracted marketplace data', () => {
    gateway.broadcastNewResponse({
      marketplaceData: { userViews: 123 },
    });
    expect(mockServer.emit).toHaveBeenCalledWith('newResponse', {
      success: true,
      data: { userViews: 123 },
      timestamp: expect.any(String),
    });
  });

  it('handleGetStats: should emit stats', async () => {
    mockService.getResponseStats.mockResolvedValue({
      total: 1,
      successful: 1,
      failed: 0,
      successRate: 100,
      averageResponseTime: 10,
    });
    await gateway.handleGetStats(mockSocket as Socket);
    expect(mockSocket.emit).toHaveBeenCalledWith('statsResponse', {
      success: true,
      data: expect.objectContaining({ total: 1 }),
    });
  });
});
