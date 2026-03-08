import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { RealPriceCache, Announcement, User } from "@zipath/db";

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(
    @InjectRepository(RealPriceCache)
    private readonly cacheRepo: Repository<RealPriceCache>,
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Cron("0 3 * * 0") // 매주 일요일 새벽 3시
  async handleCleanup(): Promise<void> {
    this.logger.log("데이터 정리 시작");
    await this.cleanExpiredCache();
    await this.cleanOldAnnouncements();
    await this.cleanInactiveUsers();
    this.logger.log("데이터 정리 완료");
  }

  /** 3개월 이상 된 실거래가 캐시 삭제 */
  async cleanExpiredCache(): Promise<void> {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const result = await this.cacheRepo.delete({
      fetchedAt: LessThan(threeMonthsAgo),
    });
    this.logger.log(`캐시 삭제: ${result.affected ?? 0}건`);
  }

  /** 마감 후 6개월 지난 공고 삭제 */
  async cleanOldAnnouncements(): Promise<void> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const result = await this.announcementRepo.delete({
      endDate: LessThan(sixMonthsAgo),
    });
    this.logger.log(`공고 삭제: ${result.affected ?? 0}건`);
  }

  /** 1년 이상 미접속 유저 삭제 */
  async cleanInactiveUsers(): Promise<void> {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const result = await this.userRepo.delete({
      lastActiveAt: LessThan(oneYearAgo),
    });
    this.logger.log(`미접속 유저 삭제: ${result.affected ?? 0}건`);
  }
}
