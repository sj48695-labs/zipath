import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { NotificationPreference, Notification } from "@zipath/db";

interface CreatePreferenceDto {
  userId: number;
  regions: string[];
  priceThresholdMin: number | null;
  priceThresholdMax: number | null;
  announcementKeywords: string[];
}

interface UpdatePreferenceDto {
  regions?: string[];
  priceThresholdMin?: number | null;
  priceThresholdMax?: number | null;
  announcementKeywords?: string[];
  isActive?: boolean;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepo: Repository<NotificationPreference>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  // --- Preferences ---

  async getPreference(userId: number): Promise<NotificationPreference | null> {
    return this.preferenceRepo.findOne({ where: { userId } });
  }

  async createPreference(
    dto: CreatePreferenceDto,
  ): Promise<NotificationPreference> {
    const existing = await this.preferenceRepo.findOne({
      where: { userId: dto.userId },
    });
    if (existing) {
      return this.updatePreference(existing.id, dto);
    }

    const preference = this.preferenceRepo.create({
      userId: dto.userId,
      regions: dto.regions,
      priceThresholdMin: dto.priceThresholdMin,
      priceThresholdMax: dto.priceThresholdMax,
      announcementKeywords: dto.announcementKeywords,
    });
    return this.preferenceRepo.save(preference);
  }

  async updatePreference(
    id: number,
    dto: UpdatePreferenceDto,
  ): Promise<NotificationPreference> {
    const preference = await this.preferenceRepo.findOne({ where: { id } });
    if (!preference) {
      throw new NotFoundException(
        `알림 설정을 찾을 수 없습니다. (id: ${id})`,
      );
    }

    if (dto.regions !== undefined) preference.regions = dto.regions;
    if (dto.priceThresholdMin !== undefined)
      preference.priceThresholdMin = dto.priceThresholdMin;
    if (dto.priceThresholdMax !== undefined)
      preference.priceThresholdMax = dto.priceThresholdMax;
    if (dto.announcementKeywords !== undefined)
      preference.announcementKeywords = dto.announcementKeywords;
    if (dto.isActive !== undefined) preference.isActive = dto.isActive;

    return this.preferenceRepo.save(preference);
  }

  async deletePreference(id: number): Promise<void> {
    const result = await this.preferenceRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `알림 설정을 찾을 수 없습니다. (id: ${id})`,
      );
    }
  }

  // --- Notifications ---

  async getNotifications(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const [notifications, total] = await this.notificationRepo.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { notifications, total };
  }

  async markAsRead(id: number, userId: number): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException(`알림을 찾을 수 없습니다. (id: ${id})`);
    }
    notification.readAt = new Date();
    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ readAt: new Date() })
      .where("userId = :userId AND readAt IS NULL", { userId })
      .execute();
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepo.count({
      where: { userId, readAt: IsNull() },
    });
  }
}
