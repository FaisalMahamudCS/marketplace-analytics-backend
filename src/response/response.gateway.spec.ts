import { Test, TestingModule } from '@nestjs/testing';
import { ResponseGateway } from './response.gateway';
import { ResponseService } from './response.service';
import { Server, Socket } from 'socket.io';

describe('ResponseGateway', () => {
    let gateway: ResponseGateway;
    const mockService = {
        getLatestResponse: jest.fn(),
        getResponseStats: jest.fn(),
    };

    const mockServer = { emit: jest.fn() } as unknown as Server;
    const mockSocket = { id: 'c1', emit: jest.fn() } as unknown as Socket;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ResponseGateway,
                { provide: ResponseService, useValue: mockService },
            ],
        }).compile();
        gateway = module.get<ResponseGateway>(ResponseGateway);
        (gateway as any).server = mockServer;
        jest.clearAllMocks();
    });

    it('handleConnection: should emit latest to connecting client', async () => {
        mockService.getLatestResponse.mockResolvedValue({
            marketplaceData: { activeDeals: 100 },
        });
        await gateway.handleConnection(mockSocket);
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
        await gateway.handleGetStats(mockSocket);
        expect(mockSocket.emit).toHaveBeenCalledWith('statsResponse', {
            success: true,
            data: expect.objectContaining({ total: 1 }),
        });
    });
});
