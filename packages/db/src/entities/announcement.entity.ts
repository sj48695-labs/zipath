import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity()
@Index("UQ_announcement_external_id", ["externalId"], { unique: true })
export class Announcement {
  @PrimaryGeneratedColumn()
  id!: number;

  /**
   * 외부 API 식별자 — `${HOUSE_MANAGE_NO}-${PBLANC_NO}` 형식.
   * data.go.kr 공공분양 응답의 사실상 유일 키. upsert conflict 컬럼.
   */
  @Column({ type: "varchar" })
  externalId!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ type: 'varchar' })
  organization!: string; // LH, SH 등

  @Column({ type: 'varchar' })
  region!: string;

  @Column({ type: 'varchar' })
  supplyType!: string; // 공공분양, 국민임대 등

  @Column({ type: "timestamp" })
  startDate!: Date;

  @Column({ type: "timestamp" })
  endDate!: Date;

  @Column({ nullable: true, type: "varchar" })
  detailUrl!: string | null;

  @Column({ nullable: true, type: "text" })
  summary!: string | null;

  @Column({ nullable: true, type: "jsonb" })
  rawData!: Record<string, unknown> | null;

  /**
   * API 응답으로 마지막 동기화된 시각. upsert 시 매번 갱신.
   * 3개월 초과 시 stale 로 간주되어 cleanup 대상이 된다.
   */
  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  fetchedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
