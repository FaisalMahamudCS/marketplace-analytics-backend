import { Test, TestingModule } from '@nestjs/testing';
import { ResponseService } from './response.service';
import { getModelToken } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Response, ResponseDocument } from './schemas/response.schema';
import { of, throwError } from 'rxjs';

describe('ResponseService', () => {
    let service: ResponseService;

    const mockResponseModel = {
        new: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        countDocuments: jest.fn(),
        aggregate: jest.fn(),
        findOne: jest.fn(),
    };

    const mockHttpService = {
        post: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ResponseService,
                {
                    provide: getModelToken(Response.name),
                    useValue: mockResponseModel,
                },
                {
                    provide: HttpService,
                    useValue: mockHttpService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<ResponseService>(ResponseService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('pingHttpBin', () => {
        it('should successfully ping httpbin.org and save response', async () => {
            const mockResponse = {
                status: 200,
                data: { message: 'success' },
            };

            const mockSavedResponse = {
                _id: '123',
                url: 'https://httpbin.org/anything',
                method: 'POST',
                statusCode: 200,
                responseTime: 100,
                timestamp: new Date(),
            };

            mockHttpService.post.mockReturnValue(of(mockResponse));
            mockResponseModel.save.mockResolvedValue(mockSavedResponse);

            await service.pingHttpBin();

            expect(mockHttpService.post).toHaveBeenCalledWith(
                'https://httpbin.org/anything',
                expect.any(Object),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        'User-Agent': 'Marketplace-Analytics-Backend/1.0',
                    }),
                    timeout: 10000,
                }),
            );
            expect(mockResponseModel.save).toHaveBeenCalled();
        });

        it('should handle HTTP errors gracefully', async () => {
            const mockError = {
                response: {
                    status: 500,
                    data: { error: 'Internal Server Error' },
                },
                message: 'Request failed',
            } as any;

            mockHttpService.post.mockReturnValue(throwError(() => mockError));
            mockResponseModel.save.mockResolvedValue({});

            await service.pingHttpBin();

            expect(mockResponseModel.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 500,
                    error: 'Request failed',
                }),
            );
        });

        it('should handle network errors', async () => {
            const mockError = {
                message: 'Network Error',
            };

            mockHttpService.post.mockReturnValue(throwError(() => mockError));
            mockResponseModel.save.mockResolvedValue({});

            await service.pingHttpBin();

            expect(mockResponseModel.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 0,
                    error: 'Network Error',
                }),
            );
        });
    });

    describe('getAllResponses', () => {
        it('should return paginated responses', async () => {
            const mockResponses = [
                { _id: '1', statusCode: 200, timestamp: new Date() },
                { _id: '2', statusCode: 200, timestamp: new Date() },
            ];

            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockResponses),
            };

            mockResponseModel.find.mockReturnValue(mockQuery);

            const result = await service.getAllResponses(10, 5);

            expect(result).toEqual(mockResponses);
            expect(mockResponseModel.find).toHaveBeenCalled();
            expect(mockQuery.sort).toHaveBeenCalledWith({ timestamp: -1 });
            expect(mockQuery.limit).toHaveBeenCalledWith(10);
            expect(mockQuery.skip).toHaveBeenCalledWith(5);
        });

        it('should use default pagination values', async () => {
            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue([]),
            };

            mockResponseModel.find.mockReturnValue(mockQuery);

            await service.getAllResponses();

            expect(mockQuery.limit).toHaveBeenCalledWith(100);
            expect(mockQuery.skip).toHaveBeenCalledWith(0);
        });
    });

    describe('getResponseStats', () => {
        it('should return correct statistics', async () => {
            mockResponseModel.countDocuments
                .mockResolvedValueOnce(100) // total
                .mockResolvedValueOnce(80) // successful
                .mockResolvedValueOnce(20); // failed

            mockResponseModel.aggregate.mockResolvedValue([{ avgTime: 150.5 }]);

            const result = await service.getResponseStats();

            expect(result).toEqual({
                total: 100,
                successful: 80,
                failed: 20,
                successRate: 80,
                averageResponseTime: 150.5,
            });
        });

        it('should handle zero total responses', async () => {
            mockResponseModel.countDocuments
                .mockResolvedValueOnce(0) // total
                .mockResolvedValueOnce(0) // successful
                .mockResolvedValueOnce(0); // failed

            mockResponseModel.aggregate.mockResolvedValue([]);

            const result = await service.getResponseStats();

            expect(result.successRate).toBe(0);
            expect(result.averageResponseTime).toBe(0);
        });
    });

    describe('getLatestResponse', () => {
        it('should return the latest response', async () => {
            const mockResponse = {
                _id: '123',
                statusCode: 200,
                timestamp: new Date(),
            };

            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(mockResponse),
            };

            mockResponseModel.findOne.mockReturnValue(mockQuery);

            const result = await service.getLatestResponse();

            expect(result).toEqual(mockResponse);
            expect(mockResponseModel.findOne).toHaveBeenCalled();
            expect(mockQuery.sort).toHaveBeenCalledWith({ timestamp: -1 });
        });

        it('should return null when no responses exist', async () => {
            const mockQuery = {
                sort: jest.fn().mockReturnThis(),
                exec: jest.fn().mockResolvedValue(null),
            };

            mockResponseModel.findOne.mockReturnValue(mockQuery);

            const result = await service.getLatestResponse();

            expect(result).toBeNull();
        });
    });
});
