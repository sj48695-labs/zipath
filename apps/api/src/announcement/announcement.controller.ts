import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { AnnouncementService } from "./announcement.service";
import { matchRequestSchema } from "./dto/match-request.dto";

@Controller("announcements")
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Get()
  async findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("region") region?: string,
  ) {
    const p = Math.max(1, parseInt(page || "1", 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit || "10", 10) || 10));
    return this.announcementService.findAll(p, l, region);
  }

  @Get("sync")
  async sync() {
    await this.announcementService.syncFromApi();
    return { message: "동기화 완료" };
  }

  @Get(":id")
  async findOne(@Param("id", ParseIntPipe) id: number) {
    const result = await this.announcementService.findOne(id);
    if (!result) {
      throw new NotFoundException("공고를 찾을 수 없습니다.");
    }
    return result;
  }

  @Post(":id/match")
  async matchAnnouncement(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: unknown,
  ) {
    const parsed = matchRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues.map((i) => i.message).join(", "),
      );
    }

    const result = await this.announcementService.matchAnnouncement(
      id,
      parsed.data,
    );
    if (!result) {
      throw new NotFoundException("공고를 찾을 수 없습니다.");
    }
    return result;
  }
}
