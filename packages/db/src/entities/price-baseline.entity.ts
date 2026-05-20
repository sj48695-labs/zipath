import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Unique,
} from "typeorm";

/**
 * 변동 감지 스케줄러가 사용하는 "직전 평균가" 기준선.
 * RealPriceCache(raw API 응답)와 분리해 스케줄러 전용 상태로 관리한다.
 */
@Entity()
@Unique(["regionCode", "dealType", "yearMonth"])
export class PriceBaseline {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar" })
  regionCode!: string; // LAWD_CD (5자리)

  @Column({ type: "varchar" })
  dealType!: string; // 매매, 전세, 월세

  @Column({ type: "varchar" })
  yearMonth!: string; // YYYYMM

  @Column({ type: "bigint" })
  avgPrice!: number; // 만원 단위 평균 거래가

  @Column({ type: "int", default: 0 })
  tradeCount!: number;

  @UpdateDateColumn()
  updatedAt!: Date;
}
