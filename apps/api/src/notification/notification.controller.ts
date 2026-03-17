import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from "@nestjs/common";
import { NotificationService } from "./notification.service";

interface CreatePreferenceBody {
  userId: number;
  regions: string[];
  priceThresholdMin: number | null;
  priceThresholdMax: number | null;
  announcementKeywords: string[];
}

interface UpdatePreferenceBody {
  regions?: string[];
  priceThresholdMin?: number | null;
  priceThresholdMax?: number | null;
  announcementKeywords?: string[];
  isActive?: boolean;
}

@Controller("notifications")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // --- Preferences ---

  @Get("preferences/:userId")
  getPreference(@Param("userId", ParseIntPipe) userId: number) {
    return this.notificationService.getPreference(userId);
  }

  @Post("preferences")
  createPreference(@Body() body: CreatePreferenceBody) {
    return this.notificationService.createPreference(body);
  }

  @Put("preferences/:id")
  updatePreference(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdatePreferenceBody,
  ) {
    return this.notificationService.updatePreference(id, body);
  }

  @Delete("preferences/:id")
  deletePreference(@Param("id", ParseIntPipe) id: number) {
    return this.notificationService.deletePreference(id);
  }

  // --- Notifications ---

  @Get(":userId")
  getNotifications(
    @Param("userId", ParseIntPipe) userId: number,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.notificationService.getNotifications(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Put(":id/read")
  markAsRead(
    @Param("id", ParseIntPipe) id: number,
    @Body("userId", ParseIntPipe) userId: number,
  ) {
    return this.notificationService.markAsRead(id, userId);
  }

  @Put("read-all/:userId")
  markAllAsRead(@Param("userId", ParseIntPipe) userId: number) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Get("unread-count/:userId")
  getUnreadCount(@Param("userId", ParseIntPipe) userId: number) {
    return this.notificationService.getUnreadCount(userId);
  }
}
