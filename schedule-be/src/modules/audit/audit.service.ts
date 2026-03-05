import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  /**
   * Fire-and-forget audit logger. Never throws — errors are swallowed to
   * ensure audit logging never disrupts business logic.
   */
  async log(
    actorId: string | null,
    action: string,
    entityType: string,
    entityId: string,
    before?: Record<string, any> | null,
    after?: Record<string, any> | null,
    ip?: string,
  ): Promise<void> {
    try {
      const entry = this.auditRepo.create({
        actorId: actorId ?? null,
        action,
        entityType,
        entityId,
        before: before ?? null,
        after: after ?? null,
        ip: ip ?? null,
      });
      await this.auditRepo.save(entry);
    } catch (err) {
      this.logger.error(
        `Audit log failed: ${action} on ${entityType}:${entityId}`,
        err,
      );
    }
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return this.auditRepo.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByActor(actorId: string, limit = 50): Promise<AuditLog[]> {
    return this.auditRepo.find({
      where: { actorId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
