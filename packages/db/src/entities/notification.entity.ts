import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";

@Entity()
// (userId, type, referenceId) 조합 중복 방지 — partial unique index.
// referenceId 가 NULL 인 system 알림은 unique 제약에서 제외 (Postgres 표준 동작).
@Index("UQ_notification_user_type_reference", ["userId", "type", "referenceId"], {
  unique: true,
  where: '"referenceId" IS NOT NULL',
})
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "varchar" })
  type!: string; // 'announcement' | 'price_change' | 'subscription' | 'system'

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "text" })
  message!: string;

  // 관련 공고/실거래 ID — 중복 알림 방지 키.
  // 형식: 가격 'regionCode:yearMonth' (예: '11680:202605') / 공고 'announcement:<id>'
  @Column({ type: "varchar", nullable: true })
  referenceId!: string | null;

  @Column({ type: "timestamp", nullable: true })
  readAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
