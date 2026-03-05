import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/events',
})
export class SchedulingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SchedulingGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization?.replace('Bearer ', '') ?? '');

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET') as string,
      });

      client.data.userId = payload.sub as string;
      client.data.role = payload.role as string;

      // Auto-join personal room
      await client.join(`user:${payload.sub}`);
      this.logger.log(`Client connected: user:${payload.sub}`);
    } catch {
      this.logger.warn(
        `Unauthorized WS connection — disconnecting ${client.id}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ── Room management ───────────────────────────────────────────────────────

  @SubscribeMessage('join:location')
  async handleJoinLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() locationId: string,
  ) {
    await client.join(`location:${locationId}`);
    this.logger.log(`user:${client.data.userId} joined location:${locationId}`);
    return { ok: true, room: `location:${locationId}` };
  }

  @SubscribeMessage('leave:location')
  async handleLeaveLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() locationId: string,
  ) {
    await client.leave(`location:${locationId}`);
    this.logger.log(`user:${client.data.userId} left location:${locationId}`);
    return { ok: true };
  }

  // ── Server-side emit helpers (called by other services) ───────────────────

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToLocation(locationId: string, event: string, data: unknown) {
    this.server.to(`location:${locationId}`).emit(event, data);
  }

  emitShiftPublished(locationId: string, shiftId: string) {
    this.emitToLocation(locationId, 'shift:published', { shiftId });
  }

  emitShiftAssigned(userId: string, shiftId: string) {
    this.emitToUser(userId, 'shift:assigned', { shiftId });
  }

  emitShiftUnassigned(userId: string, shiftId: string) {
    this.emitToUser(userId, 'shift:unassigned', { shiftId });
  }

  emitSwapRequested(managerRoomId: string, swapId: string) {
    this.emitToLocation(managerRoomId, 'swap:requested', { swapId });
  }

  emitSwapResolved(userId: string, swapId: string, approved: boolean) {
    this.emitToUser(userId, approved ? 'swap:approved' : 'swap:denied', {
      swapId,
    });
  }

  emitNotification(userId: string, payload: unknown) {
    this.emitToUser(userId, 'notification:new', payload);
  }
}
