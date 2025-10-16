import { Injectable, Logger, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { MARKETPLACE_RESPONSE_REPOSITORY } from '../repositories/tokens.js';
import { MarketplaceResponseRepository } from '../repositories/marketplace-response.repository.js';
import {
    ResponseStats,
    MarketplaceData,
    MarketplaceResponseWithData,
} from '../persistence/dao/interfaces/response.dao.interface.js';

@Injectable()
export class ResponseService {
    private readonly logger = new Logger(ResponseService.name);

    constructor(
        @Inject(MARKETPLACE_RESPONSE_REPOSITORY)
        private readonly marketplaceRepository: MarketplaceResponseRepository,
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { }

    /**
     * Generate marketplace-specific payload
     */
    private generateMarketplacePayload(): MarketplaceData {
        const categories = [
            'Electronics',
            'Agriculture',
            'Manufacturing',
            'Entertainment',
            'Education',
            'Technology',
        ];
        const randomCategory =
            categories[Math.floor(Math.random() * categories.length)];
        return {
            timestamp: Date.now(),
            activeDeals: Math.floor(Math.random() * 200) + 50,
            newDeals: Math.floor(Math.random() * 10),
            averageDealValueUSD: Math.floor(Math.random() * 50000) + 5000,
            offersSubmitted: Math.floor(Math.random() * 30),
            userViews: Math.floor(Math.random() * 500),
            category: randomCategory,
        };
    }

    /**
     * Ping httpbin.org/anything endpoint with marketplace payload
     */
    async pingHttpBin(): Promise<void> {
        const startTime = Date.now();
        const marketplaceData = this.generateMarketplacePayload();

        try {
            this.logger.log('Pinging httpbin.org/anything with marketplace data...');

            const response = await firstValueFrom(
                this.httpService.post<Record<string, unknown>>(
                    'https://httpbin.org/anything',
                    marketplaceData,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': 'Marketplace-Analytics-Backend/1.0',
                        },
                        timeout: 10000,
                    },
                ),
            );

            const responseTime = Date.now() - startTime;

            const marketplaceResponseData: Record<string, unknown> = {
                url: 'https://httpbin.org/anything',
                method: 'POST',
                marketplaceData: marketplaceData,
                statusCode: response.status,
                responseData: {
                    success: true,
                    httpbinResponse: response.data,
                },
                responseTime,
                timestamp: new Date(),
            };

            await this.marketplaceRepository.create(marketplaceResponseData);
            this.logger.log(
                `Successfully pinged httpbin.org - Status: ${response.status}, Response Time: ${responseTime}ms`,
            );
        } catch (error) {
            const responseTime = Date.now() - startTime;

            const errorData: Record<string, unknown> = {
                url: 'https://httpbin.org/anything',
                method: 'POST',
                marketplaceData: marketplaceData,
                statusCode:
                    (error as { response?: { status?: number } }).response?.status || 0,
                responseData:
                    (error as { response?: { data?: unknown } }).response?.data || null,
                responseTime,
                timestamp: new Date(),
                error: (error as Error).message,
            };

            await this.marketplaceRepository.create(errorData);
            this.logger.error(
                `Failed to ping httpbin.org: ${(error as Error).message}`,
            );
        }
    }

    /**
     * Get all historical marketplace response data
     */
    async getAllResponses(
        limit: number = 100,
        offset: number = 0,
    ): Promise<MarketplaceResponseWithData[]> {
        return await this.marketplaceRepository.findAll(limit, offset);
    }

    /**
     * Get marketplace response statistics
     */
    async getResponseStats(): Promise<ResponseStats> {
        return await this.marketplaceRepository.getStats();
    }

    /**
     * Get latest marketplace response for real-time updates
     */
    async getLatestResponse(): Promise<MarketplaceResponseWithData | null> {
        return await this.marketplaceRepository.findLatest();
    }
}
