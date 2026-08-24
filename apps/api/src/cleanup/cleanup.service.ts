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
    await Promise.all([
      this.cleanExpiredCache(),
      this.cleanAnnouncements(),
      this.cleanInactiveUsers(),
    ]);
    this.logger.log("데이터 정리 완료");
  }

  /** 3개월 이상 된 실거래가 캐시 삭제 */
  async cleanExpiredCache(): Promise<void> {
    const result = await this.cacheRepo.delete({
      fetchedAt: LessThan(this.monthsAgo(3)),
    });
    this.logger.log(`캐시 삭제: ${result.affected ?? 0}건`);
  }

  /** 마감 6개월 초과 또는 3개월간 API에서 사라진 공고 삭제 */
  async cleanAnnouncements(): Promise<void> {
    const now = new Date();
    const result = await this.announcementRepo
      .createQueryBuilder("a")
      .delete()
      .where("a.endDate < :end OR a.fetchedAt < :fetched", {
        end: this.monthsAgo(6, now),
        fetched: this.monthsAgo(3, now),
      })
      .execute();
    this.logger.log(`공고 삭제: ${result.affected ?? 0}건`);
  }

  /** 1년 이상 미접속 유저 삭제 */
  async cleanInactiveUsers(): Promise<void> {
    const result = await this.userRepo.delete({
      lastActiveAt: LessThan(this.monthsAgo(12)),
    });
    this.logger.log(`미접속 유저 삭제: ${result.affected ?? 0}건`);
  }

  private monthsAgo(n: number, from = new Date()): Date {
    const d = new Date(from);
    d.setMonth(d.getMonth() - n);
    return d;
  }
}
