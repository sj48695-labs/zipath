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
      this.cleanOldAnnouncements(),
      this.cleanStaleAnnouncements(),
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

  /** 마감 후 6개월 지난 공고 삭제 */
  async cleanOldAnnouncements(): Promise<void> {
    const result = await this.announcementRepo.delete({
      endDate: LessThan(this.monthsAgo(6)),
    });
    this.logger.log(`공고 삭제(마감 6개월): ${result.affected ?? 0}건`);
  }

  /**
   * 3개월간 API 응답에 잡히지 않아 fetchedAt 갱신이 끊긴 stale 공고 삭제.
   * cleanOldAnnouncements 의 endDate 6개월 정책과 OR 효과로 동작.
   */
  async cleanStaleAnnouncements(): Promise<void> {
    const result = await this.announcementRepo.delete({
      fetchedAt: LessThan(this.monthsAgo(3)),
    });
    this.logger.log(`공고 삭제(stale 3개월): ${result.affected ?? 0}건`);
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

  private monthsAgo(n: number): Date {
    const d = new Date();
    d.setMonth(d.getMonth() - n);
    return d;
  }
}
