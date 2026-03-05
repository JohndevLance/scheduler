import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationType } from '../../common/enums/notification-type.enum';
import { QueryNotificationDto } from './dto/request/query-notification.dto';
import { SchedulingGateway } from '../gateway/scheduling.gateway';

export interface CreateNotificationPayload {
  title: string;
  body: string;
  referenceId?: string;
  referenceType?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    private readonly gateway: SchedulingGateway,
  ) {}

  // ── Internal factory — never throws ──────────────────────────────────────
  async create(
    userId: string,
    type: NotificationType,
    payload: CreateNotificationPayload,
  ): Promise<Notification> {
    const notif = this.notifRepo.create({
      userId,
      type,
      title: payload.title,
      body: payload.body,
      referenceId: payload.referenceId ?? null,
      referenceType: payload.referenceType ?? null,
      isRead: false,
    });
    const saved = await this.notifRepo.save(notif);
    this.gateway.emitNotification(userId, {
      id: saved.id,
      title: saved.title,
      body: saved.body,
      type: saved.type,
      referenceId: saved.referenceId,
      referenceType: saved.referenceType,
      isRead: false,
      createdAt: saved.createdAt,
    });
    return saved;
  }

  // ── Bulk notify multiple users ────────────────────────────────────────────
  async createForMany(
    userIds: string[],
    type: NotificationType,
    payload: CreateNotificationPayload,
  ): Promise<void> {
    if (!userIds.length) return;
    const records = userIds.map((userId) =>
      this.notifRepo.create({ userId, type, ...payload, isRead: false }),
    );
    const saved = await this.notifRepo.save(records);
    for (const notif of saved) {
      this.gateway.emitNotification(notif.userId, {
        id: notif.id,
        title: notif.title,
        body: notif.body,
        type: notif.type,
        referenceId: notif.referenceId,
        referenceType: notif.referenceType,
        isRead: false,
        createdAt: notif.createdAt,
      });
    }
  }

  // ── User-facing queries ───────────────────────────────────────────────────
  async getForUser(
    userId: string,
    query: QueryNotificationDto,
  ): Promise<[Notification[], number]> {
    const qb = this.notifRepo
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .orderBy('n.createdAt', 'DESC');

    if (query.unreadOnly) qb.andWhere('n.isRead = false');

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    qb.skip((page - 1) * limit).take(limit);

    return qb.getManyAndCount();
  }

  async unreadCount(userId: string): Promise<number> {
    return this.notifRepo.count({ where: { userId, isRead: false } });
  }

  async markRead(
    notificationId: string,
    userId: string,
  ): Promise<Notification> {
    const notif = await this.notifRepo.findOne({
      where: { id: notificationId, userId },
    });
    if (!notif) throw new NotFoundException('Notification not found');
    if (notif.isRead) return notif;
    notif.isRead = true;
    notif.readAt = new Date();
    return this.notifRepo.save(notif);
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notifRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true, readAt: new Date() })
      .where('userId = :userId AND isRead = false', { userId })
      .execute();
    return { updated: result.affected ?? 0 };
  }
}
