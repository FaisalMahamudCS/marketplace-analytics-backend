import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ResponseService } from './response.service';
import { ResponseStats } from './dao/interfaces/response.dao.interface';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      'https://marketplace-analytics-dashboard-fro.vercel.app',
    ],
  },
})
export class ResponseGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ResponseGateway.name);

  constructor(private readonly responseService: ResponseService) { }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Send latest response data to newly connected client
    void this.sendLatestResponseToClient(client);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Send latest response data to a specific client
   */
  private async sendLatestResponseToClient(client: Socket): Promise<void> {
    try {
      const latestResponse = await this.responseService.getLatestResponse();
      if (latestResponse) {
        client.emit('latestResponse', {
          success: true,
          data: latestResponse.marketplaceData,
        });
      }
    } catch (error) {
      this.logger.error(
        `Error sending latest response to client ${client.id}:`,
        error,
      );
    }
  }

  /**
   * Broadcast new marketplace data to all connected clients
   */
  broadcastNewResponse(responseData: Record<string, unknown>): void {
    this.logger.log('Broadcasting new marketplace data to all clients');

    // Extract marketplace data from the response
    const marketplaceData = (responseData as { marketplaceData: unknown })
      .marketplaceData;

    this.server.emit('newResponse', {
      success: true,
      data: marketplaceData,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast updated statistics to all connected clients
   */
  async broadcastUpdatedStats(): Promise<void> {
    try {
      const stats = await this.responseService.getResponseStats();

      this.server.emit('updatedStats', {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Error broadcasting updated stats:', error);
    }
  }

  /**
   * Handle client requests for latest data
   */
  @SubscribeMessage('getLatestData')
  async handleGetLatestData(client: Socket): Promise<void> {
    this.logger.log(`Client ${client.id} requested latest data`);
    await this.sendLatestResponseToClient(client);
  }

  /**
   * Handle client requests for statistics
   */
  @SubscribeMessage('getStats')
  async handleGetStats(client: Socket): Promise<void> {
    try {
      const stats: ResponseStats =
        await this.responseService.getResponseStats();

      client.emit('statsResponse', {
        success: true,
        data: stats,
      });
    } catch (error) {
      this.logger.error(`Error sending stats to client ${client.id}:`, error);
      client.emit('statsResponse', {
        success: false,
        error: 'Failed to fetch statistics',
      });
    }
  }
}
