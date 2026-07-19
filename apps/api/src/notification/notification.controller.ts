import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AuthRequest } from "../common/interfaces/auth-request.interface";
import { NotificationService } from "./notification.service";

interface CreatePreferenceBody {
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

function parsePageParam(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;

  return parsed;
}

@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // --- Preferences ---

  @Get("preferences")
  getPreference(@Request() req: AuthRequest) {
    return this.notificationService.getPreference(req.user.id);
  }

  @Post("preferences")
  createPreference(
    @Request() req: AuthRequest,
    @Body() body: CreatePreferenceBody,
  ) {
    return this.notificationService.createPreference(req.user.id, body);
  }

  @Put("preferences/:id")
  updatePreference(
    @Request() req: AuthRequest,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdatePreferenceBody,
  ) {
    return this.notificationService.updatePreference(id, req.user.id, body);
  }

  @Delete("preferences/:id")
  deletePreference(
    @Request() req: AuthRequest,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.notificationService.deletePreference(id, req.user.id);
  }

  // --- Notifications ---

  @Get()
  getNotifications(
    @Request() req: AuthRequest,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.notificationService.getNotifications(
      req.user.id,
      parsePageParam(page, 1),
      parsePageParam(limit, 20),
    );
  }

  @Put(":id/read")
  markAsRead(
    @Request() req: AuthRequest,
    @Param("id", ParseIntPipe) id: number,
  ) {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  @Put("read-all")
  markAllAsRead(@Request() req: AuthRequest) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  @Get("unread-count")
  getUnreadCount(@Request() req: AuthRequest) {
    return this.notificationService.getUnreadCount(req.user.id);
  }
}
